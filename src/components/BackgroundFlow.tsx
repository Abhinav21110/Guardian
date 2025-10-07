import React, { useMemo } from 'react';

export const BackgroundFlow = React.memo(() => {
  const shapes = useMemo(() => {
    return [...Array(15)].map((_, i) => ({
      id: i,
      style: {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        width: `${100 + Math.random() * 300}px`,
        height: `${100 + Math.random() * 300}px`,
        animationDelay: `${Math.random() * 5}s`,
        animationDuration: `${10 + Math.random() * 20}s`,
      },
    }));
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden gradient-flow">
      {/* Flowing geometric shapes */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.08]">
        {shapes.map((shape) => (
          <div
            key={shape.id}
            className="absolute rounded-full bg-foreground animate-float"
            style={shape.style}
          />
        ))}
      </div>
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]" 
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), 
                           linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />
    </div>
  );
});

BackgroundFlow.displayName = 'BackgroundFlow';
