import type { Meta, StoryObj } from "@storybook/react";
import FeaturedProducts from "./FeaturedProducts";

const meta: Meta<typeof FeaturedProducts> = {
  title: "Landing/FeaturedProducts",
  component: FeaturedProducts,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithPadding: Story = {
  decorators: [
    (Story) => (
      <div style={{ padding: "2rem" }}>
        <Story />
      </div>
    ),
  ],
};
