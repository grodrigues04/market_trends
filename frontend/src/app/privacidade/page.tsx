import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de privacidade" };

export default function PrivacyPolicy() {
  return (
    <article className="report-prose mx-auto max-w-3xl py-16">
      <h1 className="font-serif">Política de privacidade</h1>
      <p>
        Este site e o canal de YouTube associado a ele publicam conteúdo gerado automaticamente a partir de pesquisas
        públicas de tendências de mercado.
      </p>
      <h2>Uso das APIs do YouTube</h2>
      <p>
        A automação usa a YouTube Data API apenas para enviar vídeos ao próprio canal e definir título, descrição, tags,
        idioma e capa. Ela não acessa, coleta nem armazena dados de outros usuários do YouTube. O uso segue os{" "}
        <a href="https://www.youtube.com/t/terms">Termos de Serviço do YouTube</a> e a{" "}
        <a href="https://policies.google.com/privacy">Política de Privacidade do Google</a>.
      </p>
      <p>
        O token de acesso fica guardado somente no computador que roda a automação e pode ser revogado a qualquer momento
        em <a href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</a>.
      </p>
      <h2>Visitantes do site</h2>
      <p>Este site não usa cookies, não tem cadastro e não coleta dados pessoais de quem o visita.</p>
    </article>
  );
}
