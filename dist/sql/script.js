"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var os_1 = require("os");
/**
 * Get idempotency script prefix.
 *
 * @param item Row from query.
 * @param type Idempotency prefix type.
 */
function idempotency(item, type) {
    var obj;
    // get proper object type for `drop` statement
    switch (item.type) {
        case 'U':
            obj = 'table';
            break;
        case 'P':
            obj = 'procedure';
            break;
        case 'V':
            obj = 'view';
            break;
        case 'TF':
        case 'FN':
            obj = 'function';
            break;
        case 'TR':
            obj = 'trigger';
            break;
    }
    if (type === 'if-exists-drop') {
        // if exists drop
        return [
            "if exists (select * from sys.objects where object_id = object_id('[" + item.schema + "].[" + item.name + "]') and type = '" + item.type + "')",
            "drop " + obj + " [" + item.schema + "].[" + item.name + "]",
            "go",
            os_1.EOL
        ].join(os_1.EOL);
    }
    else if (type === 'if-not-exists') {
        // if not exists
        return [
            "if not exists (select * from sys.objects where object_id = object_id('[" + item.schema + "].[" + item.name + "]') and type = '" + item.type + "')",
            os_1.EOL
        ].join(os_1.EOL);
    }
    // none
    return '';
}
exports.idempotency = idempotency;
/**
 * Get script for table's column.
 *
 * @param item Row from `sys.columns` query.
 * @param columns Array of records from `sys.columns` query.
 * @param primaryKeys Array of records from `sys.primaryKeys` query.
 * @param foreignKeys Array of records from `sys.foreignKeys` query.
 * @param indexes Array of records from `sys.indexes` query.
 */
function table(item, columns, primaryKeys, foreignKeys, indexes) {
    var output = "create table [" + item.schema + "].[" + item.name + "]";
    output += os_1.EOL;
    output += '(';
    output += os_1.EOL;
    // columns
    for (var _i = 0, _a = columns.filter(function (x) { return x.object_id === item.object_id; }); _i < _a.length; _i++) {
        var col = _a[_i];
        output += '    ' + column(col);
        output += os_1.EOL;
    }
    // primary keys
    for (var _b = 0, _c = primaryKeys.filter(function (x) { return x.object_id === item.object_id; }); _b < _c.length; _b++) {
        var pk = _c[_b];
        output += '    ' + primaryKey(pk);
        output += os_1.EOL;
    }
    // foreign keys
    for (var _d = 0, _e = foreignKeys.filter(function (x) { return x.object_id === item.object_id; }); _d < _e.length; _d++) {
        var fk = _e[_d];
        output += '    ' + foreignKey(fk);
        output += os_1.EOL;
    }
    output += ")";
    output += os_1.EOL;
    output += 'go';
    output += os_1.EOL;
    output += os_1.EOL;
    // indexes
    for (var _f = 0, _g = indexes.filter(function (x) { return x.object_id === item.object_id; }); _f < _g.length; _f++) {
        var ix = _g[_f];
        output += index(ix);
        output += os_1.EOL;
    }
    output += 'go';
    return output;
}
exports.table = table;
/**
 * Get script for table's column.
 *
 * @param item Row from `sys.columns` query.
 */
function column(item) {
    var output = ",[" + item.name + "]";
    if (item.is_computed) {
        output += " as " + item.definition;
    }
    output += " " + item.datatype;
    switch (item.datatype) {
        case 'varchar':
        case 'char':
        case 'varbinary':
        case 'binary':
        case 'text':
            output += '(' + (item.max_length === -1 ? 'max' : item.max_length) + ')';
            break;
        case 'nvarchar':
        case 'nchar':
        case 'ntext':
            output += '(' + (item.max_length === -1 ? 'max' : item.max_length / 2) + ')';
            break;
        case 'datetime2':
        case 'time2':
        case 'datetimeoffset':
            output += '(' + item.scale + ')';
            break;
        case 'decimal':
            output += '(' + item.precision + ', ' + item.scale + ')';
            break;
    }
    if (item.collation_name) {
        output += " collate " + item.collation_name;
    }
    output += item.is_nullable ? ' null' : ' not null';
    if (item.definition) {
        output += " default" + item.definition;
    }
    if (item.is_identity) {
        output += " identity(" + (item.seed_value || 0) + ", " + (item.increment_value || 1) + ")";
    }
    return output;
}
/**
 * Get script for table's primary key.
 *
 * @param item Row from `sys.primaryKeys` query.
 */
function primaryKey(item) {
    return ",constraint [" + item.name + "] primary key ([" + item.column + "], " + (item.is_descending_key ? 'desc' : 'asc') + ")";
}
/**
 * Get script for table's foreign key.
 *
 * @param item Row from `sys.foreignKeys` query.
 */
function foreignKey(item) {
    var output = "alter table [" + item.schema + "].[" + item.table + "] with " + (item.is_not_trusted ? 'nocheck' : 'check');
    output += " add constraint [" + item.name + "] foreign key([" + item.column + "])";
    output += " references [" + item.schema + "].[" + item.table + "] ([" + item.reference + "])";
    switch (item.delete_referential_action) {
        case 1:
            output += ' on delete cascade';
            break;
        case 2:
            output += ' on delete set null';
            break;
        case 3:
            output += ' on delete set default';
            break;
    }
    switch (item.update_referential_action) {
        case 1:
            output += ' on update cascade';
            break;
        case 2:
            output += ' on update set null';
            break;
        case 3:
            output += ' on update set default';
            break;
    }
    output += " alter table [" + item.schema + "].[" + item.table + "] check constraint [" + item.name + "]";
    return output;
}
/**
 * Get script for table's indexes.
 *
 * @param item Row from `sys.indexes` query.
 */
function index(item) {
    var output = "create";
    if (item.is_unique) {
        output += ' unique';
    }
    output += " nonclustered index [" + item.name + "] on [" + item.schema + "].[" + item.table + "]";
    output += "([" + item.column + "] " + (item.is_descending_key ? 'desc' : 'asc') + ")";
    // todo (jbl): includes
    return output;
}
//# sourceMappingURL=script.js.map