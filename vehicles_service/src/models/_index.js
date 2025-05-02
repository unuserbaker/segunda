/**
 * Esta función establece una relación de uno a muchos entre dos modelos
 */
exports.relationOneToMany = ({
  One,
  ToMany,
  foreignKey,
  allowNull = true,
  as = undefined,
}) => {
  const pkMainModel = One.primaryKeyAttribute;
  One.hasMany(ToMany, {
    foreignKey: {
      name: foreignKey,
      allowNull,
    },
    as: as ?? undefined,
    onDelete: "RESTRICT",
    sourceKey: pkMainModel,
  });
  ToMany.belongsTo(One, {
    foreignKey: {
      name: foreignKey,
      allowNull,
    },
    as: as ?? undefined,
    onDelete: "RESTRICT",
    targetKey: pkMainModel,
  });
};

/** Esta función establece relaciones muchos-a-muchos entre múltiples modelos a través de una
 * tabla. */
exports.relationsManyToMany = ({
  Models = [
    {
      model: undefined,
      allowNull: undefined,
      foreign: undefined,
      as: undefined,
    },
  ],
  Through,
  foreignKey = null,
}) => {
  Models.forEach(({ model: Model, foreign, allowNull = true, as }) => {
    const pkMainModel = Model.primaryKeyAttribute;
    Model.hasMany(Through, {
      foreignKey: {
        name: foreignKey ?? foreign,
        allowNull,
      },
      as: as ?? undefined,
      onDelete: "RESTRICT",
      sourceKey: pkMainModel,
    });
    Through.belongsTo(Model, {
      foreignKey: {
        name: foreignKey ?? foreign,
        allowNull,
      },
      as: as ?? undefined,
      onDelete: "RESTRICT",
      targetKey: pkMainModel,
    });
  });
};
exports.relationsOneToOneMulti = ({
  MainModel,
  Belongs = [{ model: undefined, allowNull: true, foreign: null, as: null }],
  foreignKey = null,
}) => {
  const pkMainModel = MainModel.primaryKeyAttribute;
  Belongs.forEach(
    ({ model: Model, allowNull = true, foreign, as = undefined }) => {
      MainModel.hasOne(Model, {
        foreignKey: {
          name: foreign ?? foreignKey,
          allowNull,
        },
        as: as ?? undefined,
        onDelete: "RESTRICT",
        sourceKey: pkMainModel,
      });
      Model.belongsTo(MainModel, {
        foreignKey: {
          name: foreign ?? foreignKey,
          allowNull,
        },
        as: as ?? undefined,
        onDelete: "RESTRICT",
        targetKey: pkMainModel,
      });
    }
  );
};

/**
 * La función "createRecordLogs" tiene por objeto crear registros para un
 * modelo determinado con valores específicos y variables globales.
 * @Model el modelo de creación de registros
 * @values los valores que deben registrarse
 */
exports.createRecordLogs = async ({
  Model,
  values,
  transaction = undefined,
}) => {
  try {
    const dataModel = {
      ...values,
    };
    // eslint-disable-next-line no-unused-vars
    const { id, createdAt, ...data } = dataModel;
    const { mainGlobals } = global;

    const dataToCreate = {
      ...data,
      ...mainGlobals,
      idUsuarioOperacion: mainGlobals?.idUsuarioOperacion ?? 0,
    };
    await Model.create(dataToCreate, { transaction });
    if (transaction) await transaction.commit();
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.log("logs create error... " + Model?.name || "", error.message);
  }
};

exports.relationsOneToManyMulti = ({
  Belongs = [
    { model: undefined, allowNull: true, foreign: null, as: undefined },
  ],
  MainModel,
  foreignKey = null,
}) => {
  const pkMainModel = MainModel.primaryKeyAttribute;
  Belongs.forEach(
    ({ model: Model, allowNull = true, foreign, as = undefined }) => {
      MainModel.hasMany(Model, {
        foreignKey: {
          name: foreign ?? foreignKey,
          allowNull,
        },
        as: as ?? undefined,
        onDelete: "RESTRICT",
        sourceKey: pkMainModel,
      });
      Model.belongsTo(MainModel, {
        foreignKey: {
          name: foreign ?? foreignKey,
          allowNull,
        },
        as: as ?? undefined,
        onDelete: "RESTRICT",
        targetKey: pkMainModel,
      });
    }
  );
};

/** Esta función establece relaciones muchos-a-muchos entre múltiples modelos a través de una
 * tabla. */
exports.relationsManyToMany = ({
  Models = [
    {
      model: undefined,
      allowNull: undefined,
      foreign: undefined,
      as: undefined,
    },
  ],
  Through,
  foreignKey = null,
}) => {
  Models.forEach(({ model: Model, foreign, allowNull = true, as }) => {
    const pkMainModel = Model.primaryKeyAttribute;
    Model.hasMany(Through, {
      foreignKey: {
        name: foreignKey ?? foreign,
        allowNull,
      },
      as: as ?? undefined,
      onDelete: "RESTRICT",
      sourceKey: pkMainModel,
    });
    Through.belongsTo(Model, {
      foreignKey: {
        name: foreignKey ?? foreign,
        allowNull,
      },
      as: as ?? undefined,
      onDelete: "RESTRICT",
      targetKey: pkMainModel,
    });
  });
};
