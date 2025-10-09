"use client";

import { Download, Image as ImageIcon, Save, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ToolsToolbarProps = {
  onAddText: () => void;
  onAddImage: () => void;
  onSave?: () => void;
  onExport?: () => void;
  saveStatus?: "idle" | "saving" | "saved";
};

function getSaveButtonLabel(status: "idle" | "saving" | "saved"): string {
  if (status === "saving") {
    return "Salvando...";
  }
  if (status === "saved") {
    return "Salvo!";
  }
  return "Salvar";
}

export default function ToolsToolbar({
  onAddText,
  onAddImage,
  onSave,
  onExport,
  saveStatus = "idle",
}: ToolsToolbarProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ferramentas</CardTitle>
        <CardDescription>Adicione elementos ao canvas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          className="w-full justify-start"
          onClick={onAddText}
          size="default"
          variant="outline"
        >
          <Type className="mr-2 h-4 w-4" />
          Adicionar Texto
        </Button>
        <Button
          className="w-full justify-start"
          onClick={onAddImage}
          size="default"
          variant="outline"
        >
          <ImageIcon className="mr-2 h-4 w-4" />
          Adicionar Imagem
        </Button>

        {onSave && (
          <>
            <div className="mt-4 border-t pt-2" />
            <Button
              className="w-full justify-start"
              disabled={saveStatus === "saving"}
              onClick={onSave}
              size="default"
              variant="default"
            >
              <Save className="mr-2 h-4 w-4" />
              {getSaveButtonLabel(saveStatus)}
            </Button>
          </>
        )}

        {onExport && (
          <Button
            className="w-full justify-start"
            onClick={onExport}
            size="default"
            variant="outline"
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar Imagem
          </Button>
        )}

        {saveStatus === "saved" && (
          <div className="pt-1 text-center text-muted-foreground text-xs">
            Todas as alterações foram salvas
          </div>
        )}
      </CardContent>
    </Card>
  );
}
