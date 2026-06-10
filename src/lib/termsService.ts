/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from "./supabase.ts";

export interface TermsOfUse {
  content: string;
  lastUpdated: string;
}

export const DEFAULT_TERMS: string = `Uso Bem-vindo à União Militar Evangélica de Santa Catarina (UMESC). Ao acessar nosso site, plataformas digitais ou utilizar nossos serviços e formulários, você concorda em cumprir e vincular-se aos seguintes Termos de Uso. Se você não concorda com qualquer parte destes termos, não deverá utilizar nossos canais digitais.

1. Natureza da Entidade
A UMESC é uma associação civil de natureza religiosa e agência missionária interdenominacional. Nossas plataformas têm como objetivo a propagação do Evangelho no meio militar e civil, a comunhão entre cristãos de diferentes denominações, a divulgação de eventos, cursos, apoio espiritual e capelania.

2. Elegibilidade e Cadastro
O uso de certas funcionalidades (como inscrição em eventos, filiação ou envio de pedidos de oração) pode exigir a criação de um cadastro. Você se compromete a fornecer informações verdadeiras, exatas e atualizadas. A UMESC se reserva o direito de suspender ou encerrar contas que violem a moral cristã, a legislação vigente ou que apresentem informações falsas.

3. Propriedade Intelectual
Todo o conteúdo disponibilizado em nossas plataformas (textos, artigos, logotipos, imagens, vídeos, áudios e devocionais) é de propriedade da UMESC ou de seus parceiros licenciados, sendo protegido por leis de direitos autorais. É permitida a partilha de conteúdos para fins de evangelização, desde que citada a fonte e sem finalidade comercial.

4. Conduta do Usuário
Ao interagir em nossas plataformas (comentários, fóruns, grupos de apoio), você se compromete a: Respeitar os princípios éticos e cristãos. Não postar conteúdo ofensivo, difamatório, preconceituoso ou que instigue o ódio. Não utilizar o espaço para fins comerciais ou propaganda política não autorizada pela diretoria da UMESC.

5. Limitação de Responsabilidade
A UMESC empenha-se para manter suas plataformas seguras e funcionais, mas não garante que o acesso seja ininterrupto ou livre de erros. O apoio espiritual e a capelania oferecidos não substituem cuidados médicos, psicológicos ou psiquiátricos profissionais quando estes se fizerem necessários.

Política de Privacidade
A União Militar Evangélica de Santa Catarina (UMESC) preza pela transparência, segurança e privacidade dos dados de seus membros, voluntários, doadores e visitantes. Esta Política de Privacidade explica como coletamos, usamos, armazenamos e protegemos seus dados pessoais, em estrita conformidade com a Lei Geral de Proteção de Dados (LGPD).

1. Quais Dados Coletamos e Para Quê?
Como agência missionária interdenominacional, coletamos apenas os dados estritamente necessários para o cumprimento de nossas finalidades religiosas e administrativas:

- Dados Cadastrais: Nome, e-mail, telefone, endereço, data de nascimento. Finalidade Principal: Inscrição em eventos, envio de informativos/devocionais e comunicação geral. Base Legal (LGPD): Consentimento / Execução de Contrato.
- Dados Eclesiásticos / Profissionais: Denominação religiosa, corporação militar (PM, BM, etc.), posto/graduação. Finalidade Principal: Contextualização do apoio de capelania e alinhamento interdenominacional. Base Legal: Consentimento.
- Dados Financeiros: Dados bancários ou de cartão (via plataformas parceiras). Finalidade Principal: Processamento de dízimos, ofertas e doações missionárias. Base Legal: Execução de Contrato / Legítimo Interesse.
- Dados Sensíveis (Religiosos): Pedidos de oração, relatórios de aconselhamento espiritual. Finalidade Principal: Prestação de suporte espiritual e capelania personalizada. Base Legal: Consentimento do Titular.

Nota sobre Dados Sensíveis (Art. 5º, II da LGPD): A convicção religiosa é considerada um dado sensível. A UMESC trata esses dados com absoluto sigilo, utilizando-as exclusivamente para fins de assistência espiritual e atividades ligadas à sua natureza de agência missionária, jamais os compartilhando para fins comerciais.

2. Compartilhamento de Dados
A UMESC não vende, aluga ou comercializa seus dados pessoais. O compartilhamento de dados ocorre apenas em situações estritamente necessárias, tais como:
- Prestadores de Serviços: Empresas que processam pagamentos (para doações) ou disparam e-mails em massa (newsletters), todas submetidas a obrigações de confidencialidade e conformidade com a LGPD.
- Cumprimento Legal: Autoridades judiciais ou administrativas, quando exigido por lei.

3. Segurança dos Dados
Implementamos medidas técnicas e administrativas de segurança para proteger seus dados contra acessos não autorizados, perda, destruição ou alteração. O acesso aos dados eclesiásticos e de capelania é restrito a pessoas autorizadas pela diretoria da UMESC e que estão sujeitas ao sigilo pastoral/confidencial.

4. Período de Retenção
Mantemos seus dados pessoais apenas pelo tempo necessário para cumprir as finalidades para as quais foram coletados, inclusive para fins de cumprimento de obrigações legais, estatutárias, contábeis ou de prestação de contas de projetos missionários.

5. Garantias e Direitos do Usuário (Art. 18 da LGPD)
Você, como titular dos dados pessoais, possui os seguintes direitos garantidos, os quais podem ser exercidos a qualquer momento mediante requisição à UMESC:
- Confirmação e Acesso: Saber se a UMESC trata seus dados e obter uma cópia deles.
- Correção: Solicitar a alteração de dados incompletos, inexatos ou desatualizados.
- Anonimização ou Eliminação: Solicitar a exclusão de dados que não sejam mais necessários para as finalidades descritas, exceto nos casos em que a lei exija a retenção.
- Revogação do Consentimento: Retirar a autorização para o tratamento de seus dados a qualquer momento (o que pode inviabilizar o recebimento de comunicações ou participação em eventos).
- Portabilidade: Solicitar a transferência dos seus dados para outra entidade, quando regulamentado pela ANPD (Autoridade Nacional de Proteção de Dados).

6. Alterações nesta Política
A UMESC reserva-se o direito de atualizar estes termos e políticas periodicamente para refletir melhorias estruturais ou mudanças na legislação. Recomendamos a leitura regular desta página.

7. Canal de Atendimento (Encarregado de Dados)
Para exercer seus direitos, tirar dúvidas ou fazer solicitações sobre a proteção dos seus dados, entre em contato com o nosso Encarregado de Proteção de Dados (DPO) através do e-mail: umesc@umesc.com.br; antunes@umesc.com.br.

Última atualização: 4 de junho de 2026.`;

export const termsService = {
  /**
   * Loads the current Terms of Use and Privacy Policy.
   * Leverages Supabase if configured & table exists, otherwise fits elegantly under localStorage.
   */
  async getTerms(): Promise<TermsOfUse> {
    const defaultObj: TermsOfUse = {
      content: DEFAULT_TERMS,
      lastUpdated: "2026-06-04T00:00:00.000Z"
    };

    // 1. Check local storage
    const localContent = localStorage.getItem("umesc_terms_content");
    const localUpdated = localStorage.getItem("umesc_terms_last_updated");
    if (localContent && localUpdated) {
      defaultObj.content = localContent;
      defaultObj.lastUpdated = localUpdated;
    }

    // 2. Try Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("settings")
          .select("value, updated_at")
          .eq("key", "terms_of_use")
          .limit(1);

        if (!error && data && data.length > 0) {
          const content = data[0].value;
          const lastUpdated = data[0].updated_at || new Date().toISOString();
          
          // Keep local storage in sync as cache
          localStorage.setItem("umesc_terms_content", content);
          localStorage.setItem("umesc_terms_last_updated", lastUpdated);
          
          return { content, lastUpdated };
        }
      } catch (err) {
        console.warn("Could not load terms from Supabase settings table. Using localStorage cache/default.", err);
      }
    }

    return defaultObj;
  },

  /**
   * Saves updated Terms of Use.
   * Writes to localStorage and tries to mirror on Supabase settings.
   */
  async saveTerms(content: string): Promise<boolean> {
    const timestamp = new Date().toISOString();
    
    // 1. Write to localStorage immediately
    localStorage.setItem("umesc_terms_content", content);
    localStorage.setItem("umesc_terms_last_updated", timestamp);

    // 2. Write to Supabase settings if configured
    if (isSupabaseConfigured && supabase) {
      try {
        // Upsert terms of use setting
        const { error } = await supabase
          .from("settings")
          .upsert(
            { key: "terms_of_use", value: content, updated_at: timestamp },
            { onConflict: "key" }
          );

        if (error) {
          console.warn("Could not save to Supabase 'settings' table: ", error.message);
        }
      } catch (err) {
        console.warn("Failed Supabase mirror write. Terms saved successfully in local/contingency mode.", err);
      }
    }

    return true;
  }
};
