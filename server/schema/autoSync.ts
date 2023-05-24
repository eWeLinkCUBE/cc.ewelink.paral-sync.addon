import { Schema } from 'express-validator';
import { notNull, mustBeType } from '../utils/validate';

const autoSyncSchema: Schema = {
    autoSync: {
        in: ['params', 'body'],
        notEmpty: notNull('autoSync'),
        isBoolean: mustBeType('autoSync', 'boolean'),
    },
};

export default autoSyncSchema;
