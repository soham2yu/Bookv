import { useEffect, useState } from "react";

interface FloatingElement {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  animationDelay: number;
  type: "circle" | "square" | "triangle";
}

export function FloatingElements() {
  const [elements, setElements] = useState<FloatingElement[]>([]);

  useEffect(() => {
    const newElements: FloatingElement[] = [];
    const colors = [
      "rgba(212, 175, 55, 0.3)",
      "rgba(102, 126, 234, 0.3)",
      "rgba(240, 147, 251, 0.3)",
      "rgba(244, 208, 63, 0.3)",
    ];

    for (let i = 0; i < 15; i++) {
      newElements.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 60 + 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        animationDelay: Math.random() * 5,
        type: ["circle", "square", "triangle"][Math.floor(Math.random() * 3)] as "circle" | "square" | "triangle",
      });
    }

    setElements(newElements);
  }, []);

  const renderShape = (element: FloatingElement) => {
    const style = {
      width: `${element.size}px`,
      height: `${element.size}px`,
      backgroundColor: element.color,
      animationDelay: `${element.animationDelay}s`,
    };

    switch (element.type) {
      case "circle":
        return (
          <div
            key={element.id}
            className="absolute rounded-full floating-element opacity-20"
            style={{
              ...style,
              left: `${element.x}%`,
              top: `${element.y}%`,
            }}
          />
        );
      case "square":
        return (
          <div
            key={element.id}
            className="absolute rounded-lg floating-element opacity-20"
            style={{
              ...style,
              left: `${element.x}%`,
              top: `${element.y}%`,
            }}
          />
        );
      case "triangle":
        return (
          <div
            key={element.id}
            className="absolute floating-element opacity-20"
            style={{
              left: `${element.x}%`,
              top: `${element.y}%`,
              width: 0,
              height: 0,
              borderLeft: `${element.size / 2}px solid transparent`,
              borderRight: `${element.size / 2}px solid transparent`,
              borderBottom: `${element.size}px solid ${element.color}`,
              animationDelay: `${element.animationDelay}s`,
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {elements.map(renderShape)}
    </div>
  );
}
