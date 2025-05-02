const yargs = require("yargs/yargs")(process.argv.slice(2));
const { execSync } = require("child_process");

// Configura yargs para aceptar un argumento (nombre)
const argv = yargs
  .command("seed:up", "up seed por nombre")
  .option("file", {
    alias: "f",
    describe: "nombre del archivo a up",
    type: "string",
    demandOption: true,
  })
  .help().argv;

// Obtén el valor del argumento pasado
const { file } = argv;

// Ejecuta el comando npx sequelize seed:generate con el parámetro personalizado
const comando = `npx sequelize db:seed --seeders-path ./src/db/seeders --config ./config/index.js --seed ${file}`;

(async () => {
  try {
    execSync(comando, { stdio: "inherit" });

    // renombrar el archivo .js generado a .cjs usando el comando 'rename'
  } catch (error) {
    console.error("Error al ejecutar el comando:", error.message);
    process.exit(1);
  }
})();
