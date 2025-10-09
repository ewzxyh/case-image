import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { dbHelpers } from "@/lib/database";
import type { MediaAssetResponse } from "@/lib/types/api";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number.parseInt(searchParams.get("limit") || "50", 10);
    const offset = Number.parseInt(searchParams.get("offset") || "0", 10);
    const tags = searchParams.get("tags")?.split(",").filter(Boolean);

    // Buscar assets
    const assets = await dbHelpers.listMedia({
      limit,
      offset,
      tags,
    });

    // Mapear para resposta
    const response: MediaAssetResponse[] = assets.map((asset) => ({
      id: asset.id,
      name: asset.name,
      description: asset.description,
      fileUrl: asset.file_url,
      thumbnailUrl: asset.thumbnail_url,
      fileType: asset.file_type,
      fileSize: asset.file_size,
      width: asset.width,
      height: asset.height,
      tags: asset.tags || [],
      created_at: asset.created_at.toISOString(),
    }));

    return NextResponse.json({
      assets: response,
      total: assets.length,
    });
  } catch (_error) {
    return NextResponse.json(
      { error: "Erro ao buscar media assets" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const tagsStr = formData.get("tags") as string;
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Arquivo é obrigatório" },
        { status: 400 }
      );
    }

    // Criar diretório de uploads se não existir
    const uploadsDir = join(process.cwd(), "public", "uploads", "media");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Gerar nome único para o arquivo
    const fileExtension = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);

    // Salvar arquivo no servidor
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/media/${fileName}`;
    const tags = tagsStr ? tagsStr.split(",").filter(Boolean) : [];

    // Inserir no banco
    const asset = await dbHelpers.insertMedia({
      name: name || file.name,
      description: description || undefined,
      file_url: fileUrl,
      file_key: fileName,
      file_type: file.type,
      file_size: file.size,
      tags,
      is_public: true,
    });

    return NextResponse.json(
      {
        success: true,
        asset: {
          id: asset.id,
          name: asset.name,
          description: asset.description,
          fileUrl: asset.file_url,
          thumbnailUrl: asset.thumbnail_url,
          fileType: asset.file_type,
          fileSize: asset.file_size,
          width: asset.width,
          height: asset.height,
          tags: asset.tags || [],
          created_at: asset.created_at.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (_error) {
    return NextResponse.json(
      { error: "Erro ao fazer upload de media" },
      { status: 500 }
    );
  }
}
