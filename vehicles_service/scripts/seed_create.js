const yargs = require("yargs/yargs")(process.argv.slice(2));
const { execSync } = require("child_process");

// Configura yargs para aceptar un argumento (nombre)
const argv = yargs
  .command("seed:generate", "crear archivo seeder")
  .option("table", {
    alias: "t",
    describe: "nombre de tabla a poblar",
    type: "string",
    demandOption: true,
  })
  .help().argv;

// Obtén el valor del argumento pasado
const { table } = argv;

// Ejecuta el comando npx sequelize seed:generate con el parámetro personalizado
const comando = `npx sequelize seed:generate --seeders-path ./src/db/seeders --name seed-${
  table || "noname"
}`;

(async () => {
  try {
    execSync(comando, { stdio: "inherit" });
  } catch (error) {
    console.error("Error al ejecutar el comando:", error.message);
    process.exit(1);
  }
})();
