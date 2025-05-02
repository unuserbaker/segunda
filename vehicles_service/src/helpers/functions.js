exports.getColumsSaredLogs = (seq) => {
  return {
    id: {
      type: seq.DataTypes.BIGINT,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    IDTHIS: {
      type: seq.DataTypes.BIGINT,
      allowNull: false,
    },
    browserId: {
      type: seq.DataTypes.STRING,
      allowNull: true,
    },
    ipUsuarioOperacion: {
      type: seq.DataTypes.STRING(60),
      allowNull: true,
    },
    idUsuarioOperacion: {
      type: seq.DataTypes.BIGINT,
      allowNull: true,
    },
    clientAgent: {
      type: seq.DataTypes.STRING,
      allowNull: true,
    },
    tipoOperacion: {
      type: seq.DataTypes.STRING(20),
      allowNull: true,
    },
    createdAt: {
      type: seq.DataTypes.DATE,
      allowNull: true,
      defaultValue: seq.literal("CURRENT_TIMESTAMP"),
      field: "createdAt",
    },
  };
};
