import { NextRequest } from "next/server";
import { google } from "googleapis";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: folderId } = await params;
  try {
    const auth = process.env.GOOGLE_API_KEY_2;

    const drive = google.drive({ version: "v3", auth });
    const response = await drive.files.list({
      q: `'${folderId}' in parents and (mimeType contains 'image/')`,
      fields:
        "files(id, name, mimeType, webContentLink, imageMediaMetadata, webViewLink, thumbnailLink, size)",
    });

    if (response.data.files && response.data.files.length > 0) {
      return new Response(JSON.stringify(response.data.files), {
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new Response("No images found in the google drive folder", {
        status: 404,
      });
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(
        `Error fetching google drive folder ${folderId}:`,
        error.message
      );
    } else {
      console.error(
        `Unknown error fetching google drive folder ${folderId}:`,
        error
      );
    }
    return new Response("Error fetching google drive folder", { status: 500 });
  }
}
