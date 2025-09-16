import { IndexTable, Text, Badge } from "@shopify/polaris";

export function CampaignTable({
  items,
  searchSuffix,
}: {
  items: any[];
  searchSuffix: string;
}) {
  const resourceName = { singular: "campaign", plural: "campaigns" };

  if (!items?.length) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <Text as="p" variant="bodyMd" tone="subdued">
          No campaigns found
        </Text>
      </div>
    );
  }

  return (
    <IndexTable
      resourceName={resourceName}
      itemCount={items.length}
      selectable={false}
      headings={[
        { title: "Title" },
        { title: "Status" },
        { title: "Target Type" },
        { title: "Updated At" },
      ]}
    >
      {items.map((campaign, index) => (
        <IndexTable.Row id={campaign._id} key={campaign._id} position={index}>
          <IndexTable.Cell>
            <a
              href={`/app/campaigns/${campaign.id}${searchSuffix}`}
              style={{ textDecoration: "none", color: "#0070f3" }}
            >
              {campaign.title}
            </a>
          </IndexTable.Cell>
          <IndexTable.Cell>
            <Badge
              tone={campaign.status === "Active" ? "success" : "attention"}
            >
              {campaign.status}
            </Badge>
          </IndexTable.Cell>
          <IndexTable.Cell>
            <Text as="span" variant="bodyMd">
              {campaign.targetType}
            </Text>
          </IndexTable.Cell>
          <IndexTable.Cell>
            <Text as="span" variant="bodyMd">
              {new Intl.DateTimeFormat("en-US", {
                year: "numeric",
                month: "long",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(campaign.updatedAt))}
            </Text>
          </IndexTable.Cell>
        </IndexTable.Row>
      ))}
    </IndexTable>
  );
}
