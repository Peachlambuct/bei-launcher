import React from 'react';

export interface Plugin {
    id: string,
    name: string,
    keywords: string[],
    icon: React.ElementType,
    component: React.ComponentType<{ onBack: () => void }>
}