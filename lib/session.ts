// this file is a wrapper with defaults to be used in both API routes and `getServerSideProps` functions
import {withIronSession} from 'next-iron-session';
import {GetServerSideProps, NextApiHandler} from 'next';

export default function withSession(handler: NextApiHandler | GetServerSideProps) {
    return withIronSession(handler, {
        password: process.env.SECRET_COOKIE_PASSWORD,
        cookieName: 'bloger',
        cookieOptions: {
            secure: false  // https的cookie不可以发给http,反之可以
        }
    });
}
