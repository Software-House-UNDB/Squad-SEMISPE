// Executar no host com os containers do docker-compose.yml já iniciados.
const { execFileSync, spawnSync } = require('node:child_process');
const database = `semispe_reservations_test_${Date.now()}`;
if (!/^semispe_reservations_test_\d+$/.test(database)) {
  throw new Error('Nome inválido para o banco temporário.');
}

function sql(input) {
  return execFileSync(
    'docker',
    [
      'exec',
      '-i',
      'semispe-db',
      'sh',
      '-c',
      'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysql -uroot --batch --skip-column-names',
    ],
    { input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
  );
}

let granted = false;
try {
  sql(`CREATE DATABASE \`${database}\`;`);
  sql(`GRANT ALL PRIVILEGES ON \`${database}\`.* TO 'semispe'@'%';`);
  granted = true;
  const result = spawnSync(
    'docker',
    [
      'exec',
      '-e',
      `DB_DATABASE=${database}`,
      '-e',
      'NODE_ENV=production',
      'semispe-back',
      'npm',
      'run',
      'test:reservations:mysql',
    ],
    { encoding: 'utf8', timeout: 150000, maxBuffer: 8 * 1024 * 1024 },
  );
  process.stdout.write(result.stdout ?? '');
  process.stderr.write(result.stderr ?? '');
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  try {
    if (granted)
      sql(`REVOKE ALL PRIVILEGES ON \`${database}\`.* FROM 'semispe'@'%';`);
  } finally {
    sql(`DROP DATABASE IF EXISTS \`${database}\`;`);
    console.log(`Banco temporário removido: ${database}`);
  }
}
