
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';

interface SettingsProps {
  user: User | null;
}

const Settings: React.FC<SettingsProps> = ({ user }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState('');

  if (user?.role !== UserRole.ADMIN) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="bg-red-500/10 p-6 rounded-full mb-6"><i className="fas fa-lock text-red-500 text-6xl"></i></div>
        <h2 className="text-3xl font-black text-white mb-4">Acesso Negado</h2>
      </div>
    );
  }

  const handleImportLegacyData = async () => {
    if (!confirm('Deseja importar os dados do CSV legado para o banco de dados atual? Isso pode criar duplicatas se rodado mais de uma vez.')) return;
    
    setIsImporting(true);
    setImportStatus('Processando CSV...');

    const csvData = `id;created_by;data_hora;local;individuo_nome;individuo_documento;equipe_unidade;equipe_viatura;equipe_integrantes;resultado;observacoes;created_at;updated_at;foto_path;individuo_data_nascimento;alcunha;individuo_id;faccao;mae
2ef4d8ef-580b-452c-b288-7c2285db5605;5b98470e-ea00-4a56-b4ad-fb7baab9776c;2026-01-30 19:24:23.670944+00;Avenida Fontoura, 76 - Silviolândia - Coxim - MS;Isaque Caires de Oliveira;;;;;Liberado;;2026-01-30 19:24:23.670944+00;2026-02-07 12:12:11.635921+00;5b98470e-ea00-4a56-b4ad-fb7baab9776c/c408d0ca-d1d9-4446-8f7b-ef466b9e9575.jpeg;2026-01-01;;bb3de955-fcf7-4401-8b8a-a36e2ac409b8;;
c0212925-b98b-4223-be58-3da02bbfd91d;78b668b5-6287-4fd7-a774-ef64260fb930;2026-02-07 14:36:15.099017+00;Rua taquari ;Thauan Cardoso de Araújo ;;;;;Liberado;;2026-02-07 14:36:15.099017+00;2026-02-07 14:36:16.847927+00;78b668b5-6287-4fd7-a774-ef64260fb930/c0212925-b98b-4223-be58-3da02bbfd91d/3ee60b43-40a9-455c-bc37-f640a08d791f.jpg;1998-10-13;;8458ed5d-8344-4cc1-b2b7-07b0c895dfbd;PCC;
78e24e97-231e-494e-b3ed-0f96a803012a;5b98470e-ea00-4a56-b4ad-fb7baab9776c;2026-02-11 21:06:57.762571+00;Rua Oscar Serrou Camy, 936 - Morada Altos São Pedro - Coxim - MS;Moncerat de los angeles brazoban;;;;;Liberado;;2026-02-11 21:06:57.762571+00;2026-02-12 00:48:42.869247+00;5b98470e-ea00-4a56-b4ad-fb7baab9776c/78e24e97-231e-494e-b3ed-0f96a803012a/4319614d-6b06-4238-a1c9-98e8306a1779.jpg;2003-10-13;;3563fdaf-dbfd-440d-be6f-a90ac35de9bc;;
d3ce6fc1-249d-4005-812c-0c9b124a1569;78b668b5-6287-4fd7-a774-ef64260fb930;2026-02-12 18:25:37.377831+00;SÃO LUIZ;LAURO LAURINHO;;;;;Liberado;"FUNÇÃO: FRENTE/IRMÃO BATIZADO. LOGISTICA.";2026-02-12 18:25:37.377831+00;2026-02-12 18:25:39.387731+00;78b668b5-6287-4fd7-a774-ef64260fb930/d3ce6fc1-249d-4005-812c-0c9b124a1569/9ef8e0fd-dc76-49b0-ae68-87bd24240295.jpeg;1900-01-01;MAGNATA;214c4db9-7003-462d-8b35-08d0493a520a;CV;
c3657f11-bd8e-4bc6-9b77-9dc462559bfe;78b668b5-6287-4fd7-a774-ef64260fb930;2026-02-12 19:45:15.432639+00;PEDRO GOMES;FRANCISCO INICIUS LEONCIO BARROSO;;;;;Outro;"BATIZADO. DISCIPLINA REGIONAL DE PEDRO GOMES";2026-02-12 19:45:15.432639+00;2026-02-12 19:45:17.507374+00;78b668b5-6287-4fd7-a774-ef64260fb930/c3657f11-bd8e-4bc6-9b77-9dc462559bfe/615017c3-a73c-4be2-942b-41b1ea9e59d5.jpeg;2002-08-30;BOLADINHO;bf4f55ae-6e2d-4277-b90e-8948bad3ef56;PCC;FRANCIELE LEONCIO BARROSO`;

    const lines = csvData.split('\n').slice(1);
    let successCount = 0;

    for (const line of lines) {
      if (!line.trim()) continue;
      const parts = line.split(';');
      
      const appId = parts[0];
      const dataHoraStr = parts[2];
      const local = parts[3];
      const indNome = parts[4];
      const indDoc = parts[5];
      const vtr = parts[7];
      const resultado = parts[9];
      const obs = parts[10]?.replace(/"/g, '');
      const fotoPath = parts[13];
      const indNasc = parts[14];
      const alcunha = parts[15];
      const indId = parts[16];
      const faccao = parts[17];
      const mae = parts[18];

      try {
        // 1. Garante que o indivíduo existe
        await supabase.from('individuos').upsert({
          id: indId,
          nome: indNome,
          alcunha: alcunha,
          documento: indDoc,
          data_nascimento: indNasc === '1900-01-01' ? null : indNasc,
          mae: mae,
          faccao: faccao,
          updated_at: new Date().toISOString()
        });

        // 2. Insere a abordagem
        const dt = new Date(dataHoraStr);
        await supabase.from('abordagens').upsert({
          id: appId,
          data: dt.toISOString().split('T')[0],
          horario: dt.toTimeString().split(' ')[0].substring(0, 5),
          local: local,
          vtr: vtr,
          resultado: resultado,
          relatorio: obs || `Abordagem registrada via importação CSV. Nome: ${indNome}`,
          individuo_nome: indNome,
          individuo_id: indId,
          foto_path: fotoPath
        });

        successCount++;
      } catch (e) {
        console.error('Erro na linha:', indNome, e);
      }
    }

    setImportStatus(`Importação concluída: ${successCount} registros sincronizados.`);
    setIsImporting(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="flex items-center space-x-3 mb-8">
        <div className="bg-slate-700 p-2.5 rounded-lg"><i className="fas fa-cog text-white text-xl"></i></div>
        <h2 className="text-2xl font-black text-white">Configurações de Administrador</h2>
      </div>

      <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl space-y-6">
        <div>
          <h3 className="text-lg font-bold text-white mb-2 flex items-center">
            <i className="fas fa-file-import mr-3 text-yellow-600"></i> Importação de Dados Legados
          </h3>
          <p className="text-slate-400 text-sm">
            Utilize esta ferramenta para injetar os registros do CSV fornecido (Isaque, Thauan, Moncerat, etc) no banco de dados central do SGAFT.
          </p>
        </div>

        {importStatus && (
          <div className="bg-blue-600/10 border border-blue-600/30 p-4 rounded-xl text-blue-400 text-xs font-bold uppercase">
            <i className="fas fa-info-circle mr-2"></i> {importStatus}
          </div>
        )}

        <button 
          onClick={handleImportLegacyData}
          disabled={isImporting}
          className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all shadow-lg uppercase tracking-widest text-sm"
        >
          {isImporting ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-sync mr-2"></i>}
          {isImporting ? 'Sincronizando...' : 'Iniciar Sincronização CSV'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
