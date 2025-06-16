import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Image, Zap, FileText } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

const Workspace = () => {
  const tools = [
    {
      title: "Gerador de Texto",
      description: "Crie textos, artigos e conteúdo usando IA avançada",
      icon: FileText,
      color: "bg-blue-500"
    },
    {
      title: "Gerador de Imagens", 
      description: "Gere imagens únicas com inteligência artificial",
      icon: Image,
      color: "bg-purple-500"
    },
    {
      title: "Automação Social",
      description: "Configure posts automáticos para redes sociais",
      icon: Zap,
      color: "bg-orange-500"
    },
    {
      title: "Chat com IA",
      description: "Converse com assistentes de IA especializados",
      icon: Bot,
      color: "bg-green-500"
    }
  ];

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Workspace</h1>
          <p className="text-muted-foreground">
            Escolha uma ferramenta para começar a criar conteúdo
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`w-12 h-12 ${tool.color} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle>{tool.title}</CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Usar Ferramenta</Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default Workspace;