import { MapPin } from 'lucide-react';
import photoTrapiche from '../../assets/photos/photo-trapiche-santo-angelo.jpg';
import graphicTriangulos from '../../assets/graphics/graphic-brand-triangles.svg';
import shapeTopografico from '../../assets/graphics/shape-hero-topographic-lines.svg';
import { Button } from './ui/Button';
import { SectionPill } from './ui/SectionPill';
import { type NavItem } from '../../models/navigation.model';

export interface HeroProps {
  /** Chamada para a Estrutura (espaços do Parque) */
  onEspacosClick?: () => void;
  /** Seção representada (rótulo e cor de identidade da pílula de abertura) */
  section?: NavItem;
}

export function Hero({ onEspacosClick, section }: HeroProps) {
  return (
    <section
      id="quem-somos"
      className="relative scroll-mt-16 overflow-hidden bg-gradient-to-b from-[#033165] via-[#1f71b7] to-[#008ecb] text-semispe-light pt-8 pb-16 lg:pt-14 lg:pb-24"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Título Principal — entra de baixo com fadeInUp */}
        <div className="relative z-10 mb-10 lg:mb-14">
          {section && (
            <SectionPill
              label={section.label}
              accent={section.accent}
              className="mb-5"
              style={{ animation: 'fadeInUp 0.6s ease-out both' }}
            />
          )}
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15]"
            style={{ animation: 'fadeInUp 0.7s ease-out both' }}
          >
            A transformação <br />
            começa <span className="text-semispe-yellow">aqui e agora.</span>
          </h1>
        </div>

        {/* Grid Principal: Lado a Lado */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          
          {/* Lado Esquerdo: entra da esquerda com delay */}
          <div
            className="lg:col-span-5 relative flex justify-center"
            style={{ animation: 'fadeInLeft 0.8s ease-out 0.2s both' }}
          >
            <div className="relative w-full max-w-[340px] sm:max-w-[380px]">

              {/* Shape topográfico estático atrás da foto: quase do tamanho dela e deslocado
                  para cima e para a direita, de modo que as curvas apareçam contornando o
                  topo e a lateral direita. A caixa abaixo ocupa a área da moldura 4/5. */}
              <div className="absolute inset-x-0 top-0 z-0 aspect-[4/5] pointer-events-none select-none">
                <img
                  src={shapeTopografico}
                  alt=""
                  aria-hidden="true"
                  className="absolute left-1/2 top-1/2 w-[116%] max-w-none -translate-x-[36%] -translate-y-[52%]"
                />
              </div>

              {/* Moldura da Imagem com o corte da máscara do Figma:
                  - Topo esquerdo: Curva ampla (rounded-tl-[6.5rem])
                  - Topo direito: Linha reta com canto vivo (rounded-tr-none)
                  - Base direita: Curva convexa ampla (rounded-br-[5.5rem])
                  - Base esquerda: Canto reto (rounded-bl-none)
              */}
              <div className="relative z-10 w-full aspect-[4/5] rounded-tl-[6.5rem] rounded-tr-none rounded-br-[5.5rem] rounded-bl-none overflow-hidden shadow-2xl bg-[#033165] group">
                <img
                  src={photoTrapiche}
                  alt="Complexo Trapiche Santo Ângelo - Sede do Parque Tecnológico de São Luís"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Tag de identificação com pílula protetora de contraste */}
              <div className="mt-3.5 flex justify-end  relative z-20">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#033165]/95 border border-white/25 backdrop-blur-md shadow-xl text-xs text-white select-none">
                  <MapPin className="w-3.5 h-3.5 text-semispe-yellow shrink-0" />
                  <span className="font-semibold tracking-wide">Trapiche Santo Ângelo • Centro</span>
                </div>
              </div>

              {/* Asset dos Triângulos Oficiais ancorado no canto inferior esquerdo */}
              <div className="absolute -bottom-6 -left-6 z-20 w-24 h-24 sm:w-28 sm:h-28 pointer-events-none select-none drop-shadow-lg">
                <img
                  src={graphicTriangulos}
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-contain"
                />
              </div>

            </div>
          </div>

          {/* Lado Direito: entra da direita com delay maior */}
          <div
            className="relative z-10 lg:col-span-7 flex flex-col justify-center"
            style={{ animation: 'fadeInRight 0.8s ease-out 0.35s both' }}
          >
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-semispe-yellow mb-5 tracking-tight">
              Bem vindo!
            </h2>

            <div className="space-y-4 text-semispe-light/95 text-base sm:text-lg leading-relaxed max-w-xl">
              <p>
                O <strong>Parque Tecnológico de São Luís</strong> é o ambiente central de conexão entre governo, universidades, empresas, startups, pesquisadores, investidores e sociedade civil.
              </p>
              <p className="text-sm sm:text-base text-semispe-light/85">
                Instalado no histórico Trapiche Santo Ângelo, promovemos a cultura de inovação, infraestrutura colaborativa e o fortalecimento de novos negócios para o nosso município.
              </p>
            </div>

            {/* Botão CTA: entra por último + pulso em loop após aparecer */}
            <div
              className="mt-8"
              style={{ animation: 'fadeInUp 0.6s ease-out 0.55s both' }}
            >
              <Button
                size="lg"
                variant="primary"
                onClick={onEspacosClick}
                className="w-full sm:w-auto text-xs sm:text-sm tracking-wider px-8 py-3.5 font-black rounded-xl shadow-lg hover:shadow-semispe-yellow/30 text-semispe-blue-dark"
                style={{ animation: 'ctaPulse 2.5s ease-in-out 1.5s infinite' }}
              >
                CONHEÇA NOSSOS ESPAÇOS
              </Button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
