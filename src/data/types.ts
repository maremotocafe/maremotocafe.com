export interface MenuItem {
  nombre: string;
  prioridad?: boolean;
  disponible?: boolean;
  imagen: string;
  imagen_pequenya?: string;
  categorias: string[];
  ingredientes?: string;
  alergenos?: string;
  txt_aclaraciones?: string;
  txt_temporal?: string;
  grad_alcoholica?: string;
  vol_ml?: string;
  edul_gr?: string;
  pvp_local?: string;
  pvp_terraza?: string;
  pvp?: string;
}

export interface MenuCategory {
  nombre: string;
  icono: string;
  color: string;
  subcategorias?: { nombre: string }[];
}

export interface MenuConfig {
  title: string;
  description: string;
  description_icon: string;
  paso1: string;
  paso2: string;
  paso3: string;
  items_iniciales: number;
  items_incremento: number;
  no_items_mensaje: string;
  no_items_icono: string;
  nombres_datos: string[];
  titulos_datos: Record<string, string>;
  iconos_datos: Record<string, string>;
  icono_todo: string;
  color_todo: string;
  color_bordes: string;
}
