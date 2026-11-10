#!/bin/sh
# journal: read the McAmner Journal from the guest shell.
# The page writes this into 9p and installs it as /usr/bin/journal and
# /usr/bin/theme. It talks to the page with OSC 7337 sequences, which
# linux.js accepts only for an exact journal path or a known theme.

J=/journal
THEMES="default amber green mono"

osc() { printf '\033]7337;%s\007' "$1"; }

entries() { (cd "$J" && ls -1 -- */*.txt 2>/dev/null); }

usage() {
	cat <<'EOF'
journal open <path or word>  read an entry; the page URL links to it
journal random               read a random entry
journal latest               the newest entry of each type
theme <default|amber|green|mono>
EOF
}

open_entry() {
	# An exact path wins; otherwise any part of it: stalker, films/006.
	match=$(entries | grep -Fx -- "$1")
	[ -n "$match" ] || match=$(entries | grep -F -- "$1")
	count=$(printf '%s\n' "$match" | grep -c .)
	if [ "$count" -eq 0 ]; then
		echo "journal: no entry matches '$1'" >&2
		return 1
	fi
	if [ "$count" -gt 1 ]; then
		echo "journal: '$1' matches more than one entry:" >&2
		printf '%s\n' "$match" | sed 's/^/  /' >&2
		return 1
	fi
	osc "open;$match"
	less -- "$J/$match"
}

[ "${0##*/}" = theme ] && set -- theme "$@"

case "$1" in
open)
	[ -n "$2" ] || { usage >&2; exit 2; }
	open_entry "$2"
	;;
random)
	total=$(entries | grep -c .)
	[ "$total" -gt 0 ] || { echo "journal: no entries" >&2; exit 1; }
	n=$(( $(od -An -N4 -tu4 /dev/urandom) % total + 1 ))
	open_entry "$(entries | sed -n "${n}p")"
	;;
latest)
	for d in "$J"/*/; do
		ls -1 "$d" | tail -n 1 | sed "s|^|${d#"$J"/}|"
	done
	;;
theme)
	for t in $THEMES; do
		if [ "$2" = "$t" ]; then
			osc "theme;$t"
			echo "theme: $t"
			exit 0
		fi
	done
	echo "usage: theme <default|amber|green|mono>" >&2
	exit 2
	;;
*)
	usage
	;;
esac
