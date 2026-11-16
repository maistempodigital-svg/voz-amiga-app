// Rolagem que o tour consegue mover sozinho (para levar o botão destacado até a tela).
import React, { createContext, useRef } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, ScrollViewProps } from 'react-native';

export interface Rolador { rolar: (dy: number) => void }
export const RolagemCtx = createContext<Rolador | null>(null);

/** Use no lugar de <ScrollView> nas telas que o tour percorre. */
export function RolagemTour({ children, ...props }: ScrollViewProps & { children?: React.ReactNode }) {
  const ref = useRef<ScrollView>(null);
  const y = useRef(0);
  const rolador = useRef<Rolador>({ rolar: (dy) => ref.current?.scrollTo({ y: Math.max(0, y.current + dy), animated: false }) }).current;
  return (
    <RolagemCtx.Provider value={rolador}>
      <ScrollView
        ref={ref}
        scrollEventThrottle={32}
        {...props}
        onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => { y.current = e.nativeEvent.contentOffset.y; props.onScroll?.(e); }}
      >
        {children}
      </ScrollView>
    </RolagemCtx.Provider>
  );
}
