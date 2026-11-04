import { Link } from 'react-router-dom';
import { Construction } from 'lucide-react';
import { type EstruturaMenuItem } from '../../models/estrutura.model';
import { useEstruturaContext } from '../../viewmodels/useEstruturaViewModel';

/** Tela provisória das opções da Estrutura que ainda estão em construção */
export function ComingSoonPanel({ itemId }: { itemId: EstruturaMenuItem['id'] }) {
  const vm = useEstruturaContext();
  const item = vm.menu.find((menuItem) => menuItem.id === itemId);

  return (
    <div className="max-w-xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-semispe-blue-dark/10">
      <span className="grid place-items-center w-12 h-12 rounded-full bg-semispe-yellow-light">
        <Construction className="w-6 h-6" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-black tracking-tight">{item?.label}</h1>
      <p className="mt-2 text-sm text-semispe-blue-dark/75 leading-relaxed">
        Esta parte está em construção e chega nas próximas etapas.
      </p>
      <Link
        to="/estrutura"
        className="mt-6 inline-flex items-center rounded-xl bg-semispe-blue-dark px-5 py-3 text-xs font-black tracking-wider uppercase text-white transition-colors hover:bg-semispe-yellow-light hover:text-semispe-blue-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-semispe-blue-dark focus-visible:ring-offset-2"
      >
        Ver nossos espaços
      </Link>
    </div>
  );
}
