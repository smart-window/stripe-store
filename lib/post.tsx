import path from 'path';
import matter from 'gray-matter';
import fs, {promises as fsPromise} from 'fs';
import marked from 'marked';

const markdownDir = path.join(process.cwd(), 'markdown');
export const getPost = async () => {
    const files = await fsPromise.readdir(markdownDir, {encoding: 'utf8'});
    return files.map((fileName) => {
        const fullPath = path.join(markdownDir, fileName),
            id = fileName.replace(/\.md$/g, ''),
            fileContent = fs.readFileSync(fullPath, 'utf-8'),
            {data: {title, date}} = matter(fileContent);
        return {
            id, title, date
        };
    });
};

export const getPostById = (id: string) => {
    const fullPath = path.join(markdownDir, `${id}.md`),
        fileContent = fs.readFileSync(fullPath, 'utf-8'),
        {data: {title, date}, content} = matter(fileContent),
        html = marked(content);
    return JSON.parse(JSON.stringify({
        id, title, date, content: html
    }));
};
