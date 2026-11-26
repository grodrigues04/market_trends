// The 25 niches of the research brief, by number (the country tables refer to them by number)
export const NICHES: Record<number, string> = {
  1: "Tecnologia e negócios digitais",
  2: "Saúde e bem-estar",
  3: "Educação",
  4: "Finanças",
  5: "Relacionamentos e desenvolvimento pessoal",
  6: "Casa e estilo de vida",
  7: "Pets",
  8: "Moda e beleza",
  9: "Alimentação e nutrição",
  10: "Entretenimento e hobbies",
  11: "Mercado B2B",
  12: "Mercados e tendências emergentes",
  13: "Agronegócio",
  14: "Mercado automotivo",
  15: "Mercado imobiliário",
  16: "Serviços profissionais",
  17: "Eventos e experiências",
  18: "Públicos específicos",
  19: "Indústria e comércio",
  20: "Logística e transporte",
  21: "Mercados especializados",
  22: "Serviços residenciais",
  23: "Economia de consumo especializada",
  24: "Tecnologia em setores tradicionais",
  25: "Outros micronichos",
};

export function nicheName(niche: number): string {
  return NICHES[niche] ?? `Nicho ${niche}`;
}
