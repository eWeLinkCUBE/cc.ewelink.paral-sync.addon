import { Schema } from 'express-validator';
import { notNull, mustBeType } from '../utils/validate';

const schema: Schema = {
    isSyncTarget: {
        in: ['query'],
        notEmpty: notNull('isSyncTarget'),
        isString: mustBeType('isSyncTarget', 'string')
    }
};

export default schema;
