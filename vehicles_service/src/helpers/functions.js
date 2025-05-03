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
    browser_id: {
      type: seq.DataTypes.STRING,
      allowNull: true,
    },
    ip: {
      type: seq.DataTypes.STRING(60),
      allowNull: true,
    },
    user_id: {
      type: seq.DataTypes.BIGINT,
      allowNull: true,
    },
    client_agent: {
      type: seq.DataTypes.STRING,
      allowNull: true,
    },
    operation_type: {
      type: seq.DataTypes.STRING(20),
      allowNull: true,
    },
    created_at: {
      type: seq.DataTypes.DATE,
      allowNull: true,
      defaultValue: seq.literal("CURRENT_TIMESTAMP"),
      field: "created_at",
    },
  };
};
