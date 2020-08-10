import { Request, Response } from 'express';
import db from '../database/connections';
import convertHourToMinutes from '../database/utils/convertHoursToMinutes';




//definindo um objeto do banco de dados
interface ScheduleItem {
    week_day: number;
    from: string,
    to: string
}


export default class ClassesController {

    async index(req: Request, res: Response) {
        const filters = req.query;

        const subject = filters.subject as string;
        const week_day = filters.week_day as string;
        const time = filters.time as string

        if (!filters.week_day || !filters.subject || !filters.time) {
            return res.status(404).json({
                error: "Missing filters to search time"
            });
        }

        const timeInMinutes = convertHourToMinutes(time);

        const classes = await db('classes')
            .whereExists(function () {
                this.select('class_schedule.*')
                .from('class_schedule')
                .whereRaw('`class_schedule`.`class_id` = `classes`.`id`')
                .whereRaw('`class_schedule`.`week_day` = ??', [Number(week_day)])
                .whereRaw('`class_schedule`.`from` <= ??', [timeInMinutes])
                .whereRaw('`class_schedule`.`to` > ??', [timeInMinutes])
            })
            .join('users', 'classes.user_id', '=', 'users.id').select(['classes.*', 'users.*']);

        return res.json(classes);
    }

    async create(req: Request, res: Response) {
        //desestruturação {nome, avatar, ...} porque estamos pegando essas variáveis que já existe em outro arquivo
        const {
            name,
            avatar,
            whatsapp,
            bio,
            subject,
            cost,
            schedule
        } = req.body;


        const trx = await db.transaction();

        try {
            const insertUsersIds = await trx('users').insert({
                name, avatar, whatsapp, bio,
            });

            const user_id = insertUsersIds[0];

            const insertedClassesIds = await trx('classes').insert({
                subject, cost, user_id
            });

            const class_id = insertedClassesIds[0];

            //transforma as horas em minutos
            //ScheduleItem é o formato definido que o valor tem de receber.
            const classSchedule = schedule.map((scheduleItem: ScheduleItem) => {
                return {
                    class_id,
                    week_day: scheduleItem.week_day,
                    from: convertHourToMinutes(scheduleItem.from),
                    to: convertHourToMinutes(scheduleItem.to)
                };
            })

            await trx('class_schedule').insert(classSchedule);


            await trx.commit();
            return res.status(201).send();
        } catch (err) {
            await trx.rollback();
            return res.status(404).json({
                error: 'Unexpected error while creating new class'
            })
        }
    }
}