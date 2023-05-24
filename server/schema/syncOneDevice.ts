import { Schema } from 'express-validator';
import { notNull, mustBeType } from '../utils/validate';

const schema: Schema = {
    from: {
        in: ['body'],
        notEmpty: notNull('from'),
        isString: mustBeType('from', 'string')
    }
};

export default schema;
