import { NextResponse } from "next/server";

export async function GET() {
  try {
    const url = "https://spectra-headerfooter-poc.s3.us-east-1.amazonaws.com";
    const response = await fetch(`${url}/footer.html`);
    if (!response.ok) {
      throw new Error("Failed to fetch footer");
    }
    const footerHtml = await response.text();
    // add the base url to src attributes and styles.css in the footerHtml
    const baseUrl =
      "https://spectra-headerfooter-poc.s3.us-east-1.amazonaws.com";
    const updatedFooterHtml = footerHtml
      .replace(/src="(?!https?:\/\/)([^"]+)"/g, `src="${baseUrl}/$1"`)
      .replace(/href="(?!https?:\/\/)([^"]+)"/g, `href="${baseUrl}/$1"`);
    return new NextResponse(updatedFooterHtml, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    console.error("Error fetching footer:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
