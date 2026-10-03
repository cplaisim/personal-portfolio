# Knowledge Graph Portfolio

A Next.js static-export portfolio whose background is an interactive knowledge
graph, built from a sanitized snapshot of a Neo4j graph. The exported site never
connects to Neo4j at runtime and contains no database credentials.

The graph is draggable: nodes can be moved with a mouse or a finger and stay
where they are dropped. The background switches between black and white, and the
choice is remembered per visitor.

## Local Preview

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Refresh the Graph Snapshot

The snapshot comes from the profile graph defined in
`profile_graph_hierarchy.cypher`, which keys every node on `uid` and carries its
own `label`, `kind`, `level` and `group`.

Set `NEO4J_PASSWORD` in the shell (optionally `NEO4J_URI`, `NEO4J_USERNAME`),
then:

```bash
npm run export:graph
```

This writes `public/knowledge-graph.json` as `{ nodes, links }`. It defaults to
`bolt://127.0.0.1:17688`. Keep credentials in environment variables; never commit
them.

`npm run export:career-graph` is the older exporter for the fuller career graph
on port 17687. It writes `public/career-graph.json`, which the site no longer
reads.

## Build

```bash
npm run build
```

Next.js writes the static site to `out/`.

## Deploy

Pushing to `master` triggers `.github/workflows/deploy.yml`, which runs
`npm ci`, `npm run build`, and syncs `out/` to the S3 website bucket. The
workflow can also be run manually from the Actions tab.

It needs these repository settings:

| Setting | Kind | Required | Purpose |
| --- | --- | --- | --- |
| `AWS_ACCESS_KEY_ID` | secret | yes | IAM user with write access to the bucket |
| `AWS_SECRET_ACCESS_KEY` | secret | yes | — |
| `AWS_REGION` | variable | no | Defaults to `us-east-1` |
| `S3_BUCKET` | variable | no | Defaults to `charlesplaisimond.com` |

`buildspec.yml` is the earlier AWS CodeBuild definition of the same steps and is
kept for the existing CodePipeline. To deploy by hand instead, configure the AWS
CLI and run `npm run deploy`. Review the local preview before deploying.
