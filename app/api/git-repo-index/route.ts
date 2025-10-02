import { NextRequest, NextResponse } from 'next/server';
import { getMultiRepoIndexer } from '@/src/services/multiRepoIndexer';

function authorize(req: NextRequest) {
  const headerKey = req.headers.get('x-api-key') || '';
  const envKey = process.env.GIT_INDEX_API_KEY || '';
  if (!envKey) return true; // if not set, allow local usage
  return headerKey === envKey;
}

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    configuredRepos: (process.env.GIT_ADDITIONAL_REPOS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .concat([process.env.GIT_FRONTEND_REPO_PATH || '', process.env.GIT_BACKEND_REPO_PATH || '']
        .filter(Boolean)),
  });
}

export async function POST(req: NextRequest) {
  try {
    if (!authorize(req)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const includeCommits = body.includeCommits !== false;
    const includeFiles = body.includeFiles !== false;
    const specificRepos: string[] | undefined = Array.isArray(body.repos) ? body.repos : undefined;
    const useSSE = body.sse === true;

    const indexer = getMultiRepoIndexer();
    let result;
    if (useSSE) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start: async (controller) => {
          function send(event: string, data: any) {
            controller.enqueue(encoder.encode(`event: ${event}\n`));
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          }

          send('start', { includeCommits, includeFiles, repos: specificRepos });
          try {
            if (specificRepos && specificRepos.length > 0) {
              const summaries: any[] = [];
              const errors: any[] = [];
              for (const repo of specificRepos) {
                try {
                  if (includeFiles) {
                    const summary = await indexer.indexRepository(repo);
                    summaries.push(summary);
                    send('progress', { type: 'files', repo, summary });
                  }
                  if (includeCommits) {
                    const res = await indexer.indexCommits(repo);
                    send('progress', { type: 'commits', repo, res });
                  }
                } catch (e: any) {
                  const err = { repo, error: e?.message || String(e) };
                  errors.push(err);
                  send('error', err);
                }
              }
              result = { summaries, errors };
            } else {
              const r = await indexer.indexAll({ includeCommits, includeFiles });
              result = r;
              send('progress', r);
            }
            send('done', result);
            controller.close();
          } catch (e: any) {
            send('error', { error: e?.message || String(e) });
            controller.error(e);
          }
        },
      });
      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    }
    if (specificRepos && specificRepos.length > 0) {
      const summaries: any[] = [];
      const errors: any[] = [];
      for (const repo of specificRepos) {
        try {
          if (includeFiles) summaries.push(await indexer.indexRepository(repo));
          if (includeCommits) await indexer.indexCommits(repo);
        } catch (e: any) {
          errors.push({ repo, error: e?.message || String(e) });
        }
      }
      result = { summaries, errors };
    } else {
      result = await indexer.indexAll({ includeCommits, includeFiles });
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}


