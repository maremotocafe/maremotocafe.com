export const siteConfig = {
  title: "Maremoto Beach",
  baseUrl: "https://maremotocafe.com",
  language: "es",
  author: "Mario Ortiz Manero",
  description: "Maremoto Beach en Zaragoza",
  tags: "bar,pub,copas,cafeteria,cocktails,zaragoza,cafes,desayunos,brunch,zumos,reposteria,bocadillos,centro,aragon",
  logo: "/images/logo.png",
} as const;

export const banner = {
  bgImage: "/images/backgrounds/hero-area.jpg",
  title: "Maremoto Beach",
  logoTitle: "/images/logo-text.png",
  content: "*Cocktail Club*\n\n*Gin club*\n\n*Coffee & Brunch*",
  button: {
    label: "¿Qué te apetece?",
    link: "#carta",
  },
} as const;

export const contact = {
  title: "Contáctanos",
  subtitle: "Datos de Contacto",
  content:
    "¿Quieres comentarnos algo? ¿Tienes alguna duda, alguna sugerencia para mejorar? ¿Necesitas información detallada de alguno de nuestros servicios o productos? ¡No dudes en contactarnos, estaremos encantados de atenderte!",
  subjectTxt: "Asunto",
  messageTxt: "Mensaje",
  submitTxt: "Enviar",
  helpTxt:
    "Se ha producido un error. Por favor, abre tu cliente de correo preferido y mándanos un correo a maremotocafe@hotmail.com",
  email: "maremotocafe@hotmail.com",
  details: [
    {
      icon: "las la-map-marker",
      info: "**Dirección**: Cesáreo Alierta Nº 20 50008 Zaragoza",
    },
    {
      icon: "las la-phone",
      info: "**Teléfono**: [976 23 19 90](tel:+34976231990)",
    },
    {
      icon: "las la-envelope",
      info: "**Email**: [maremotocafe@hotmail.com](mailto:maremotocafe@hotmail.com)",
    },
  ],
} as const;

export const navigation = {
  home: "Inicio",
  items: [
    { name: "Carta", url: "#carta" },
    { name: "Glovo", url: "#glovo" },
    { name: "Contacto", url: "#contact" },
  ],
} as const;

export const social = [
  {
    name: "Facebook",
    icon: "lab la-facebook-f",
    link: "https://www.facebook.com/maremotobeachzaragoza",
  },
  {
    name: "Instagram",
    icon: "lab la-instagram",
    link: "https://www.instagram.com/maremoto.beach",
  },
] as const;

export const map = {
  place: "Maremoto Beach Zaragoza",
} as const;

export const scrollToTop = {
  where: "#carta",
  txt: "Ir a Carta",
  icon: "las la-angle-double-up",
} as const;

export const copyright =
  'Página desarrollada por <a href="https://nullderef.com" target="_blank" rel="noreferrer">Mario Ortiz Manero</a>.';
