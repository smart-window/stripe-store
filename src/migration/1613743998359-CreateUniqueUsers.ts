import {MigrationInterface, QueryRunner, TableIndex} from 'typeorm';

export class CreateUniqueUsers1613743998359 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        return await queryRunner.createIndex('users', new TableIndex({
            name: 'users_unique_username',
            columnNames: ['username'],
            isUnique: true
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        return await queryRunner.dropIndex('users', 'users_unique_username');
    }

}
