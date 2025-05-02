const yargs = require("yargs/yargs")(process.argv.slice(2));
const { execSync } = require("child_process");

// Configura yargs para aceptar un argumento (nombre)

const argv = yargs
  .command("migration:generate", "Genera un nuevo archivo de migracion")
  .option("name", {
    alias: "n",
    describe: "nombre del archivo",
    type: "string",
    demandOption: true,
  })
  .help().argv; // Agrega el comando de ayuda (--help)

// Obtén el valor del argumento pasado
const { name } = argv;

// Ejecuta el comando npx sequelize-cli migration:generate con el parámetro personalizado
const comando = `npx sequelize-cli migration:generate --name ${name}`;

(async () => {
  try {
    execSync(comando, { stdio: "inherit" });

    // renombrar el archivo .js generado a .cjs usando el comando 'rename'
  } catch (error) {
    console.error("Error al ejecutar el comando:", error.message);
    process.exit(1);
  }
})();
