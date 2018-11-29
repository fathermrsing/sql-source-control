/**
 * Get SQL table information.
 */
export const tablesRead: string = `
  SELECT
    o.object_id,
    o.type,
    s.name AS [schema],
    o.name
  FROM
    sys.objects o
    JOIN sys.schemas s ON o.schema_id = s.schema_id
  where
    o.type = 'U'
    AND o.is_ms_shipped = 0
  ORDER BY
    s.name,
    o.name
`;

/**
 * Get SQL column information.
 */
export const columnsRead: string = `
  SELECT
    c.object_id,
    c.name,
    tp.name AS [datatype],
    c.max_length,
    c.is_computed,
    c.precision,
    c.scale AS [scale],
    c.collation_name,
    c.is_nullable,
    dc.definition,
    ic.is_identity,
    ic.seed_value,
    ic.increment_value,
    cc.definition AS [formula]
  FROM
    sys.columns c
    JOIN sys.types tp ON c.user_type_id = tp.user_type_id
    LEFT JOIN sys.computed_columns cc ON c.object_id = cc.object_id AND c.column_id = cc.column_id
    LEFT JOIN sys.default_constraints dc ON
      c.default_object_id != 0
      AND c.object_id = dc.parent_object_id
      AND c.column_id = dc.parent_column_id
    LEFT JOIN sys.identity_columns ic ON
      c.is_identity = 1
      AND c.object_id = ic.object_id
      AND c.column_id = ic.column_id
`;

/**
 * Get SQL primary key information.
 */
export const primaryKeysRead: string = `
  SELECT
    c.object_id,
    ic.is_descending_key,
    k.name,
    c.name AS [column]
  FROM
    sys.index_columns ic
    JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
    LEFT JOIN sys.key_constraints k ON k.parent_object_id = ic.object_id
  WHERE
    ic.is_included_column = 0
    AND ic.index_id = k.unique_index_id
    AND k.type = 'PK'
`;

/**
 * Get SQL foreign key information.
 */
export const foreignKeysRead: string = `
  SELECT
    po.object_id,
    k.constraint_object_id,
    fk.is_not_trusted,
    c.name AS [column],
    rc.name AS [reference],
    fk.name,
    SCHEMA_NAME(ro.schema_id) AS [schema],
    po.name AS [table],
    SCHEMA_NAME(ro.schema_id) AS [parent_schema],
    ro.name AS [parent_table],
    fk.delete_referential_action,
    fk.update_referential_action
  FROM
    sys.foreign_key_columns k
    JOIN sys.columns rc ON rc.object_id = k.referenced_object_id AND rc.column_id = k.referenced_column_id
    JOIN sys.columns c ON c.object_id = k.parent_object_id AND c.column_id = k.parent_column_id
    JOIN sys.foreign_keys fk ON fk.object_id = k.constraint_object_id
    JOIN sys.objects ro ON ro.object_id = fk.referenced_object_id
    JOIN sys.objects po ON po.object_id = fk.parent_object_id
`;

/**
 * Get SQL index information.
 */
export const indexesRead: string = `
  SELECT
    ic.object_id,
    ic.index_id,
    ic.is_descending_key,
    ic.is_included_column,
    i.is_unique,
    i.name,
    c.name AS [column],
    SCHEMA_NAME(ro.schema_id) AS [schema],
    ro.name AS [table]
  FROM
    sys.index_columns ic
    JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    JOIN sys.indexes i ON i.object_id = c.object_id AND i.index_id = ic.index_id AND i.is_primary_key = 0 AND i.type = 2
    INNER JOIN sys.objects ro ON ro.object_id = c.object_id
  where
    ro.is_ms_shipped = 0
    AND ic.is_included_column = 0
  ORDER BY
    ro.schema_id,
    ro.name,
    c.object_id
`;

/**
 * Get SQL information for user defined types.
 */
export const typesRead: string = `
  SELECT
    o.object_id,
    o.type,
    s.name AS [schema],
    t.name
  FROM
    sys.table_types t
    INNER JOIN sys.objects o ON o.object_id = t.type_table_object_id
    JOIN sys.schemas s ON t.schema_id = s.schema_id
  where
    o.type = 'TT'
    AND t.is_user_defined = 1
  ORDER BY
    s.name,
    o.name
`;

/**
 * Get SQL information for procs, triggers, functions, etc.
 */
export const objectsRead: string = `
    SELECT
        OBJECT_NAME(sm.object_id) AS name ,
        s.name as [schema],
        o.type,
        sm.definition as text
    FROM sys.sql_modules AS sm JOIN sys.objects AS o ON sm.object_id = o.object_id
    left join sys.schemas As s on s.schema_id = o.schema_id
    where type in ('P', 'V', 'TF', 'IF', 'FN', 'TR')
    ORDER BY name
`;
