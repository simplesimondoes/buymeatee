type StructuredDataProps = {
  /** One or more JSON-LD objects to embed. */
  data: object | object[];
};

/** Renders schema.org JSON-LD. Server component — emitted in initial HTML. */
export function StructuredData({ data }: StructuredDataProps) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}
