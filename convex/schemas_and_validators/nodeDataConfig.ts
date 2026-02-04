const nodeDataConfig = [
  {
    type: "link",
    description: "Node for storing a link.",
    valuesSchema: {
      link: {
        href: "The url of the link. You can visit the page using the open_web_page tool.",
        pageTitle: "The title of the linked page.",
      },
    },
  },
  {
    type: "image",
    description: "Node for storing an image.",
    valuesSchema: {
      images: [
        {
          url: "The URL of the image. Use the view_image tool to view it.",
        },
      ],
    },
  },
  {
    type: "document",
    description: "Node for storing a markdown document.",
    valuesSchema: {
      doc: "The markdown content of the document.",
    },
  },
  {
    type: "value",
    description: "Node for storing a value (text, number, boolean).",
    valuesSchema: {
      value: {
        type: "The type of the value: 'text', 'number', or 'boolean'.",
        value: "The actual value stored in the node.",
        unit: "The unit of the value, if applicable (e.g., 'kg', 'm', etc.).",
        label: "An optional label for the value.",
      },
    },
  },
];

export { nodeDataConfig };
