import { useEstruturaContext } from '../../viewmodels/useEstruturaViewModel';
import { secondaryButtonClass } from './ui/formStyles';

export function SpacesLoadState() {
  const vm = useEstruturaContext();
  if (vm.spacesLoading)
    return (
      <p role="status" className="my-6">
        Carregando espaços…
      </p>
    );
  if (vm.spacesError)
    return (
      <div role="alert" className="my-6 space-y-3">
        <p>Não foi possível atualizar os espaços. Tente novamente.</p>
        <button className={secondaryButtonClass} onClick={vm.retrySpaces}>
          Tentar novamente
        </button>
      </div>
    );
  if (!vm.spaces.length)
    return (
      <p role="status" className="my-6">
        Não há espaços disponíveis para reserva no momento.
      </p>
    );
  return null;
}
