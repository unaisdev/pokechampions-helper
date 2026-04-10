import type { ReactNode } from 'react';
import { Modal, TouchableWithoutFeedback, View, type ModalProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export type BackdropModalProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Por defecto `fade` (entrada por opacidad, sin slide desde abajo). */
  animationType?: ModalProps['animationType'];
};

/**
 * Modal a pantalla con overlay semitransparente: pulsar fuera del contenido llama a `onClose`.
 * El contenido debe vivir en hijos (p. ej. tarjeta centrada); usar `pointerEvents="box-none"` en contenedores si hace falta.
 */
export function BackdropModal({
  visible,
  onClose,
  children,
  animationType = 'fade',
}: BackdropModalProps) {
  return (
    <Modal visible={visible} transparent animationType={animationType} onRequestClose={onClose}>
      <View style={styles.root}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        <View style={styles.foreground} pointerEvents="box-none">
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.overlay,
  },
  foreground: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'box-none',
  },
}));
