(function () {
  "use strict";

  function toNumericId(v) {
    if (!v) return NaN;
    const str = String(v);
    if (str.includes("gid://shopify/ProductVariant/")) {
      const parts = str.split("/");
      return Number(parts[parts.length - 1]);
    }
    const match = str.match(/(\d+)$/);
    return match ? Number(match[1]) : NaN;
  }

  const Widget = {
    cfg: null,
    offers: [],
    selectedVariantIds: [],
    uncheckedVariants: [],
    cartCache: null,
    cartCacheAt: 0,
    LOCAL_STORAGE_UNCHECKED_KEY: "easyTickUncheckedVariants",

    init(widgetId) {
      const el = document.getElementById(widgetId);
      if (!el || el.dataset.initialized === "true") return;
      el.dataset.initialized = "true";

      this.cfg = {
        el,
        productId: el.dataset.productId || "",
        collectionId: el.dataset.collectionId || "",
        pageType: el.dataset.pageType || "product",
        maxItems: Math.max(
          1,
          Math.min(20, parseInt(el.dataset.maxItems || "3", 10)),
        ),
        proxyPath: el.dataset.proxyPath || "/apps/easy-tick/campaigns",
        variantPrices: {},
        shop: el.dataset.shop || "",
      };

      this.loadUncheckedFromStorage();
      this.collectVariantPrices();
      this.interceptFormSubmissions();
      this.loadCampaigns();
    },

    collectVariantPrices() {
      document
        .querySelectorAll("[data-variant-id][data-variant-price]")
        .forEach((node) => {
          const id = toNumericId(node.getAttribute("data-variant-id"));
          const price = node.getAttribute("data-variant-price");
          if (id && price) this.cfg.variantPrices[id] = price;
        });
    },

    getSelectedVariants() {
      return this.offers.filter((offer) =>
        this.selectedVariantIds.includes(offer.variantId),
      );
    },

    addVariantsToFormData(formData, selectedVariants) {
      if (selectedVariants.length === 0) return formData;
      selectedVariants.forEach((item, index) => {
        formData.append(`items[${index}][id]`, item.variantId);
        formData.append(`items[${index}][quantity]`, item.quantity || 1);
      });
      const mainVariantId = formData.get("id");
      const mainQuantity = formData.get("quantity") || 1;
      if (mainVariantId) {
        formData.append(`items[${selectedVariants.length}][id]`, mainVariantId);
        formData.append(
          `items[${selectedVariants.length}][quantity]`,
          mainQuantity,
        );
      }
      return formData;
    },

    clearSelections() {
      this.selectedVariantIds = [];
      this.uncheckedVariants = [];
      localStorage.removeItem(this.LOCAL_STORAGE_UNCHECKED_KEY);
      if (this.cfg?.el) {
        this.cfg.el.querySelectorAll(".tick-one-checkbox").forEach((cb) => {
          cb.checked = false;
        });
      }
    },

    interceptFormSubmissions() {
      document.addEventListener("submit", (e) => {
        const form = e.target;
        if (form.matches('[action*="/cart/add"], [action*="/cart/change"]')) {
          e.preventDefault();
          const formData = new FormData(form);
          this.submitFormWithUpsells(form, formData);
        }
      });
    },

    async submitFormWithUpsells(form, formData) {
      try {
        const selectedVariants = this.getSelectedVariants();
        const updatedFormData = this.addVariantsToFormData(
          formData,
          selectedVariants,
        );
        const response = await fetch(form.action, {
          method: form.method || "POST",
          body: updatedFormData,
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            Accept: "application/json",
          },
        });
        if (!response.ok) throw new Error("Form submission failed");
        this.invalidateCartCache();
        if (this.cfg.pageType === "product") {
          this.updateCartUI(await this.getCart());
        }
      } catch (error) {
        console.error("Error submitting form with upsells:", error);
      }
    },

    async loadCampaigns() {
      const { productId, collectionId, pageType, maxItems, proxyPath, shop } =
        this.cfg;
      const qs = new URLSearchParams({
        product_id: productId,
        collection_id: collectionId,
        page_type: pageType,
        max_items: String(maxItems),
        shop,
      });
      try {
        const res = await fetch(`${proxyPath}?${qs.toString()}`, {
          method: "GET",
          credentials: "same-origin",
          headers: { Accept: "application/json" },
        });
        console.log({ res });
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        const data = await res.json();
        const campaigns = data?.campaigns || [];
        if (!campaigns.length) {
          this.hideWidget();
          return;
        }
        this.renderOffers(campaigns);
      } catch (e) {
        console.error("Error loading campaigns:", e);
        this.hideWidget();
      }
    },

    hideWidget() {
      this.cfg.el.style.display = "none";
      this.cfg.el.innerHTML = "";
    },

    async renderOffers(offers) {
      const { el, variantPrices } = this.cfg;
      el.style.display = "";
      this.offers = offers
        .map((offer) => ({
          ...offer,
          variantId: toNumericId(
            offer.selectedVariantId || offer.variantId || "",
          ),
          offerId: offer.id,
        }))
        .filter((offer) => offer.variantId && !isNaN(offer.variantId));
      if (!this.offers.length) {
        this.hideWidget();
        return;
      }

      let cartData;
      try {
        cartData = await this.getCart();
      } catch (error) {
        console.error("Error fetching cart data:", error);
        cartData = { items: [], total_price: 0 };
      }

      if (cartData.items.length === 0) {
        for (const offer of this.offers) {
          try {
            await this.removeCampaignFromCart(offer.variantId);
          } catch (error) {
            console.error("Error removing campaign from empty cart:", error);
          }
        }
        cartData = await this.getCart();
      }

      const campaignVariantIds = this.offers.map((offer) => offer.variantId);
      if (
        cartData.items.length > 0 &&
        cartData.items.every((item) =>
          campaignVariantIds.includes(toNumericId(item.variant_id)),
        )
      ) {
        for (const offer of this.offers) {
          try {
            await this.removeCampaignFromCart(offer.variantId);
          } catch (error) {
            console.error(
              "Error removing campaign from cart with only campaigns:",
              error,
            );
          }
        }
        cartData = await this.getCart();
      }

      if (cartData.items.length > 0) {
        const preCheckedOffers = this.offers.filter((offer) => offer.preCheck);
        for (const offer of preCheckedOffers) {
          if (this.uncheckedVariants.includes(offer.variantId)) continue;
          const isInCart = cartData.items.some(
            (item) => toNumericId(item.variant_id) === offer.variantId,
          );
          if (!isInCart) {
            try {
              await this.addCampaignToCart(offer.variantId);
              cartData = await this.getCart();
            } catch (error) {
              console.error("Error adding pre-checked offer:", error);
            }
          }
        }
      }

      const cartPreCheckedOffers = this.offers.filter(
        (offer) => offer.preCheck && offer.placement === "cart",
      );
      if (cartPreCheckedOffers.length > 0 && cartData.items.length > 0) {
        for (const offer of cartPreCheckedOffers) {
          if (this.uncheckedVariants.includes(offer.variantId)) continue;
          const isInCart = cartData.items.some(
            (item) => toNumericId(item.variant_id) === offer.variantId,
          );
          if (!isInCart) {
            try {
              await this.addCampaignToCart(offer.variantId);
              cartData = await this.getCart();
            } catch (error) {
              console.error("Error adding cart pre-checked offer:", error);
            }
          }
        }
        this.updateCartUI(cartData);
      }

      const html = `
        <div class="tick-one-upsell-list" style="margin: 16px 0;">
          ${this.offers
            .map((offer) => this.renderOffer(offer, variantPrices, cartData))
            .join("")}
        </div>
      `;
      el.innerHTML = html;
      this.setupCheckboxEvents();

      if (this.cfg.pageType === "product") {
        this.updateCartUI(cartData);
      }
    },

    setupCheckboxEvents() {
      if (!this.cfg?.el) return;
      this.selectedVariantIds = [];
      this.cfg.el.querySelectorAll(".tick-one-checkbox").forEach((cb) => {
        const variantId = toNumericId(cb.dataset.variantId);
        if (cb.checked && !this.selectedVariantIds.includes(variantId)) {
          this.selectedVariantIds.push(variantId);
        }
        cb.addEventListener("change", async () => {
          const previousState = cb.checked;
          try {
            if (cb.checked) {
              await this.addCampaignToCart(variantId);
              const index = this.uncheckedVariants.indexOf(variantId);
              if (index > -1) this.uncheckedVariants.splice(index, 1);
              this.saveUncheckedToStorage();
            } else {
              await this.removeCampaignFromCart(variantId);
              if (!this.uncheckedVariants.includes(variantId)) {
                this.uncheckedVariants.push(variantId);
              }
              this.saveUncheckedToStorage();
            }
          } catch (error) {
            console.error("Error updating cart:", error);
            cb.checked = previousState;
          }
        });
      });
    },

    renderOffer(offer, variantPrices, cartData) {
      const variantId = toNumericId(
        offer.selectedVariantId || offer.variantId || "",
      );
      const price = variantPrices[variantId] || offer.price || "";
      const isInCart = cartData.items.some(
        (item) => toNumericId(item.variant_id) === variantId,
      );
      const checked =
        (offer.preCheck || isInCart) &&
        !this.uncheckedVariants.includes(variantId)
          ? "checked"
          : "";

      const metadata = offer.metadata || {};
      const checkboxStyle = metadata.checkboxStyle || {};
      const fontSettings = metadata.fontSettings || {};

      const priceColor = checkboxStyle.activeColor || "#0066CC";

      const priceHtml =
        offer.showPrice && price
          ? `<span class="tick-one-price" style="color: ${priceColor}; font-weight: 700; background: ${priceColor}15; padding: 2px 6px; border-radius: 4px;">(+ $${price})</span>`
          : "";

      const cardStyle = `
        background: ${offer.backgroundColor || "#fff"};
        border: 1px solid ${offer.borderColor || "#E1E3E5"};
        border-radius: ${offer.borderRadius || 8}px;
        padding: ${offer.padding || 16}px;
        margin-bottom: 12px;
        transition: all 0.2s ease;
      `;

      const imageStyle = `
        width: ${offer.imageSize || 50}px;
        height: ${offer.imageSize || 50}px;
        border-radius: 6px;
        object-fit: cover;
        flex-shrink: 0;
        cursor: zoom-in;
        transition: opacity 0.2s ease;
      `;

      const checkboxStyleInline = `
        background-color: ${checkboxStyle.backgroundColor || "#FFFFFF"};
        border: 1px solid ${checkboxStyle.borderColor || "#E1E3E5"};
        accent-color: ${checkboxStyle.activeColor || "#0066CC"};
        width: ${checkboxStyle.size || 20}px;
        height: ${checkboxStyle.size || 20}px;
        margin: 0;
        appearance: auto;
        cursor: pointer;
      `;

      const fontStyle = `
        font-size: ${fontSettings.size || 14}px;
        color: ${fontSettings.color || "#000000"};
        font-weight: ${fontSettings.weight || "normal"};
      `;

      const imageHtml = offer.imageUrl
        ? `<img src="${this.escapeAttr(offer.imageUrl)}" 
         alt="${this.escapeAttr(offer.heading || offer.title)}" 
         style="${imageStyle}"
         onclick="event.stopPropagation(); window.EasyTickWidget.showImageModal('${this.escapeAttr(offer.imageUrl)}', '${this.escapeAttr(offer.heading || offer.title)}')"
         onmouseover="this.style.opacity='0.8'"
         onmouseout="this.style.opacity='1'"
         title="Click to preview">`
        : "";

      return `
          <div class="tick-one-upsell-card" 
            style="${cardStyle}"
          >
            <div style="display: flex; align-items: center; gap: 12px;">
              <input type="checkbox"
                class="tick-one-checkbox"
                data-variant-id="${variantId}"
                data-offer-id="${offer.id}"
                ${checked}
                style="${checkboxStyleInline}"
                onclick="event.stopPropagation()"
              >
              ${offer.showImage ? imageHtml : ""}
              <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <span style="${fontStyle}; font-weight: 700;">
                    ${this.escape(offer.heading || offer.title)}
                  </span>
                  ${priceHtml}
                </div>
                  ${
                    offer.description
                      ? `<div style="${fontStyle}; opacity: 0.8; font-size: ${(fontSettings.size || 14) - 1}px; text-align: left;">
                        ${this.escape(offer.description)}
                      </div>`
                      : ""
                  }
              </div>
            </div>
        </div>
      `;
    },

    async addCampaignToCart(variantId) {
      try {
        const cartData = await this.getCart();
        if (this.cfg.pageType === "cart" && cartData.items.length === 0) {
          return;
        }

        const isInCart = cartData.items.some(
          (item) => toNumericId(item.variant_id) === variantId,
        );
        if (isInCart) {
          return;
        }

        const formData = new FormData();
        formData.append("items[0][id]", variantId);
        formData.append("items[0][quantity]", 1);

        const response = await fetch("/cart/add", {
          method: "POST",
          body: formData,
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            Accept: "application/json",
          },
        });

        if (!response.ok) throw new Error("Failed to add campaign to cart");

        this.invalidateCartCache();
        this.updateCartUI(await this.getCart());
      } catch (error) {
        console.error("Error adding campaign to cart:", error);
      }
    },

    async removeCampaignFromCart(variantId) {
      try {
        const response = await fetch(`/cart/update.js`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({ updates: { [variantId]: 0 } }),
        });

        if (!response.ok)
          throw new Error("Failed to remove campaign from cart");

        this.invalidateCartCache();
        this.updateCartUI(await this.getCart());
      } catch (error) {
        console.error("Error removing campaign from cart:", error);
      }
    },

    updateCartUI(cartData) {
      const totalPriceSpan = document.querySelector(
        ".cart__checkout-total span:last-child",
      );

      if (totalPriceSpan) {
        totalPriceSpan.textContent = `$${(cartData.total_price / 100).toFixed(2)}`;
      }
    },

    showImageModal(imageSrc, title) {
      this.hideImageModal();
      const modal = document.createElement("div");
      modal.id = "easy-tick-image-modal";
      modal.innerHTML = `
        <div class="tick-one-modal-overlay" onclick="window.EasyTickWidget.hideImageModal()">
          <div class="tick-one-modal-content" onclick="event.stopPropagation()">
            <div class="tick-one-modal-header">
              <h3>${this.escape(title)}</h3>
              <button class="tick-one-modal-close" onclick="window.EasyTickWidget.hideImageModal()">×</button>
            </div>
            <div class="tick-one-modal-body">
              <img src="${this.escapeAttr(imageSrc)}" alt="${this.escapeAttr(
                title,
              )}" class="tick-one-modal-image">
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      const handleEscape = (e) => {
        if (e.key === "Escape") {
          this.hideImageModal();
          document.removeEventListener("keydown", handleEscape);
        }
      };
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    },

    hideImageModal() {
      const modal = document.getElementById("easy-tick-image-modal");
      if (modal) {
        modal.remove();
        document.body.style.overflow = "";
      }
    },

    escape(s) {
      if (!s) return "";
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    },

    escapeAttr(s) {
      return this.escape(String(s || "")).replace(/"/g, "&quot;");
    },

    async getCart() {
      const now = Date.now();
      if (this.cartCache && now - this.cartCacheAt < 1000)
        return this.cartCache;
      const response = await fetch("/cart.js", {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("Failed to fetch cart data");
      this.cartCache = await response.json();
      this.cartCacheAt = now;
      return this.cartCache;
    },

    invalidateCartCache() {
      this.cartCache = null;
      this.cartCacheAt = 0;
    },

    saveUncheckedToStorage() {
      localStorage.setItem(
        this.LOCAL_STORAGE_UNCHECKED_KEY,
        JSON.stringify(this.uncheckedVariants),
      );
    },

    loadUncheckedFromStorage() {
      const stored = localStorage.getItem(this.LOCAL_STORAGE_UNCHECKED_KEY);
      if (stored) {
        this.uncheckedVariants = JSON.parse(stored);
      }
    },
  };

  window.EasyTickHelper = {
    getSelectedUpsells() {
      return Widget.getSelectedVariants();
    },
    clearAll() {
      return Widget.clearSelections();
    },
    getWidget() {
      return Widget;
    },
  };

  window.EasyTickWidget = Widget;

  async function initializeWidgets() {
    const widgets = document.querySelectorAll(
      '[id^="easy-tick-"], [id^="tick-one-"]',
    );
    widgets.forEach((el) => {
      if (el.id && !el.dataset.initialized) {
        Widget.init(el.id);
      }
    });

    if (Widget.cfg?.pageType === "product") {
      try {
        const cartData = await Widget.getCart();
        Widget.updateCartUI(cartData);
      } catch (error) {
        console.error("Error syncing cart UI after reload:", error);
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeWidgets);
  } else {
    setTimeout(initializeWidgets, 100);
  }
})();
