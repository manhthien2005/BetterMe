"""Read-only integrity and documentation-link check; run from any working directory."""
import argparse
import hashlib
import json
import re
from pathlib import Path
from urllib.parse import unquote

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]


def digest(path):
    with path.open('rb') as file:
        return hashlib.file_digest(file, 'sha256').hexdigest()


def checked_path(root, relative):
    path = (root / relative).resolve()
    if not path.is_relative_to(root.resolve()):
        raise ValueError(f'Path escapes root: {relative}')
    return path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--working', action='store_true', help='Also compare current art files with approved v18')
    args = parser.parse_args()
    lock = json.loads((HERE / 'reference-v18.json').read_text(encoding='utf-8'))
    snapshot = checked_path(REPO, lock['snapshotRoot'])
    working = checked_path(REPO, lock['workingRoot'])
    errors, count, working_count = [], 0, 0
    for entry in lock['files']:
        path = checked_path(snapshot, entry['path'])
        if not path.is_file() or path.stat().st_size != entry['bytes'] or digest(path) != entry['sha256']:
            errors.append(f'Snapshot mismatch: {entry["path"]}')
        count += 1
        if args.working and entry.get('workingPath'):
            path = checked_path(working, entry['workingPath'])
            if not path.is_file() or path.stat().st_size != entry['bytes'] or digest(path) != entry['sha256']:
                errors.append(f'Working mismatch: {entry["workingPath"]}')
            working_count += 1
    links = 0
    for doc in HERE.glob('*.md'):
        for target in re.findall(r'\]\(([^)]+)\)', doc.read_text(encoding='utf-8')):
            if target.startswith(('http://', 'https://', '#')):
                continue
            path = (doc.parent / unquote(target.split('#', 1)[0].strip('<>'))).resolve()
            if not path.is_relative_to(REPO) or not path.exists():
                errors.append(f'Broken/outside link: {doc.name} -> {target}')
            links += 1
    if errors:
        print('\n'.join(errors))
        raise SystemExit(1)
    print(f'APPROVED_V18_INTEGRITY_PASS: {count} snapshot files, {working_count} working files, {links} local documentation links')
    print(f'GLB_SHA256 {lock["islandSha256"]}')


if __name__ == '__main__':
    main()
