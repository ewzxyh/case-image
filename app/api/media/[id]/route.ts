import { existsSync } from "node:fs";
import { unlink } from "node:fs/promises";
import { join } from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/database";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assetId } = await params;

    if (!assetId) {
      return NextResponse.json(
        { error: "ID do asset não fornecido" },
        { status: 400 }
      );
    }

    // Buscar asset para obter informações do arquivo
    const [asset] = await sql`
            SELECT * FROM media_assets WHERE id = ${assetId}
        `;

    if (!asset) {
      return NextResponse.json(
        { error: "Asset não encontrado" },
        { status: 404 }
      );
    }

    // Deletar arquivo físico se existir
    if (asset.file_key) {
      const filePath = join(
        process.cwd(),
        "public",
        "uploads",
        "media",
        asset.file_key
      );
      if (existsSync(filePath)) {
        try {
          await unlink(filePath);
        } catch (_error) {
          // Continua mesmo se falhar ao deletar arquivo
        }
      }
    }

    // Deletar do banco de dados
    await sql`
            DELETE FROM media_assets WHERE id = ${assetId}
        `;

    return NextResponse.json({
      success: true,
      message: "Asset deletado com sucesso",
    });
  } catch (_error) {
    return NextResponse.json(
      { error: "Erro ao deletar asset" },
      { status: 500 }
    );
  }
}
