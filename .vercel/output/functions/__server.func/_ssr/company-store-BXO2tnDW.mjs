import { r as __exportAll } from "../_runtime.mjs";
import { A as renderVerification, C as localDraft, D as ownedChecksPass, E as nextMemory, F as walksIntoCycle, M as systemPrompt, N as titleFrom, O as planFromModel, P as verifyArtifacts, S as isMissionStatus, T as nextDefects, _ as canonicalAssignments, a as DEPARTMENTS$1, b as evidenceStillCovers, d as PIPELINE, g as assertMissionTransition, h as assemblePacket, i as CompanyError, j as reworkFrom, k as providerDecision, m as allPassed, p as agentBySlug, t as AGENTS, u as PAYMENT, v as departmentRank, w as localPlan, x as formatMoney, y as dollarsToCents } from "./company-cyOhrTv5.mjs";
import { t as __exportAll$1 } from "./rolldown-runtime-D7D4PA-g.mjs";
import { A as editParty, E as createParty, O as deactivateRole, R as listOffers, T as createOffer, U as reactivateRole, c as addContact, k as editOffer, nt as ventureSummary, q as retireOffer, v as archiveParty, y as assignRole, z as listParties } from "./venture-Apl_n6dM.mjs";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync, spawn } from "node:child_process";
//#region node_modules/.nitro/vite/services/ssr/assets/company-store-BXO2tnDW.js
var company_store_BXO2tnDW_exports = /* @__PURE__ */ __exportAll({
	$: () => setMilestone,
	A: () => recordExpenditure,
	B: () => requestExternalAction,
	C: () => missionView,
	D: () => proposeSpecification,
	E: () => planMission,
	F: () => refreshGithub,
	G: () => rework,
	H: () => reserveFunds,
	I: () => registerDevice,
	J: () => setClassification,
	K: () => runNext,
	L: () => registerIntegration,
	M: () => recordPayment,
	N: () => recordPrice,
	O: () => reactivateCompanyRole,
	P: () => recoverRun,
	Q: () => setDisclosure,
	R: () => rejectMission,
	S: () => linkMissionTask,
	T: () => payments,
	U: () => retireCompanyOffer,
	V: () => requireOwnerScope,
	W: () => revokeGithub,
	X: () => setDepartmentBudget,
	Y: () => setCostPolicy,
	Z: () => setDependency,
	_: () => editCompanyOffer,
	a: () => archiveCompanyParty,
	at: () => submitMission,
	b: () => knowledge,
	c: () => authorizeRevalidation,
	ct: () => workforce,
	d: () => commandDevice,
	et: () => setMissionBudget,
	f: () => company_store_exports,
	g: () => deactivateCompanyRole,
	h: () => createCompanyParty,
	i: () => answerMission,
	it: () => setSpendingCeiling,
	j: () => recordObservation,
	k: () => readGithubForDepartment,
	l: () => cancelMission,
	lt: () => expireLeases,
	m: () => createCompanyOffer,
	n: () => acceptSpecification,
	nt: () => setPriority,
	o: () => assignCompanyRole,
	ot: () => unlinkMissionTask,
	p: () => connectGithub,
	q: () => setCapacity,
	r: () => addCompanyContact,
	rt: () => setScheduler,
	s: () => authorizeMission,
	st: () => voidPayment,
	t: () => acceptMission,
	tt: () => setParent,
	u: () => commandCenter,
	ut: () => assertCommandRate,
	v: () => editCompanyParty,
	w: () => operations,
	x: () => linkMissionProject,
	y: () => governance,
	z: () => reopenMission
});
/** Per-process command limit. It does not apply across multiple servers. */
var WINDOW_MS = 6e4;
var LIMIT = 40;
var hits = /* @__PURE__ */ new Map();
var dropped = 0;
function commandRateSnapshot() {
	return {
		tracked: hits.size,
		dropped,
		limit: LIMIT,
		windowMs: WINDOW_MS
	};
}
function assertCommandRate(userId, now = Date.now()) {
	const recent = (hits.get(userId) ?? []).filter((at) => now - at < WINDOW_MS);
	if (recent.length >= LIMIT) {
		hits.set(userId, recent);
		throw new Error("Too many company commands. Wait a minute.");
	}
	recent.push(now);
	hits.set(userId, recent);
	for (const [key, stamps] of hits) {
		if (key === userId) continue;
		if (stamps.filter((at) => now - at < WINDOW_MS).length === 0) {
			hits.delete(key);
			dropped += 1;
		}
	}
}
/** OS boundary applied to every sandboxed process. A separate process without these is not enough. */
var SANDBOX = {
	suite: "nexus-qa-1",
	policy: "nexus-isolate-1",
	memoryBytes: 402653184,
	cpuSeconds: 2,
	processes: 64,
	fileBytes: 1048576,
	timeoutMs: 4e3,
	network: "none",
	filesystem: "pivot-root",
	proc: "subset-pid",
	env: "minimal",
	capabilities: "dropped",
	/** This host maps only uid 0, so a second uid cannot exist. Capabilities are cleared instead. */
	identity: "uid-0-no-caps",
	seccomp: "deny-host-control"
};
var BOX = "/sys/fs/cgroup/nexus-qa";
var cgroupReady = null;
/** Enables a child cgroup. RLIMIT_AS cannot cap Node: V8 reserves a huge address space and faults. */
function prepareCgroup() {
	if (cgroupReady !== null) return cgroupReady;
	try {
		const root = "/sys/fs/cgroup";
		if (!existsSync(`${root}/cgroup.controllers`)) {
			cgroupReady = false;
			return false;
		}
		const init = `${root}/nexus-init`;
		mkdirSync(init, { recursive: true });
		for (let pass = 0; pass < 6; pass += 1) {
			const procs = readFileSync(`${root}/cgroup.procs`, "utf8").split(/\s+/).filter(Boolean);
			if (procs.length === 0) break;
			for (const pid of procs) try {
				writeFileSync(`${init}/cgroup.procs`, pid);
			} catch {}
		}
		if (!readFileSync(`${root}/cgroup.procs`, "utf8").trim()) try {
			writeFileSync(`${root}/cgroup.subtree_control`, "+memory +cpu +pids");
		} catch {}
		mkdirSync(BOX, { recursive: true });
		writeFileSync(`${BOX}/memory.max`, String(SANDBOX.memoryBytes));
		writeFileSync(`${BOX}/memory.swap.max`, "0");
		writeFileSync(`${BOX}/pids.max`, String(SANDBOX.processes));
		cgroupReady = existsSync(`${BOX}/memory.max`);
		return cgroupReady;
	} catch {
		cgroupReady = false;
		return false;
	}
}
function killGroup(child) {
	if (!child.pid) return;
	try {
		process.kill(-child.pid, "SIGKILL");
	} catch {
		try {
			child.kill("SIGKILL");
		} catch {}
	}
}
function shQuote(value) {
	return `'${value.replaceAll("'", `'\\''`)}'`;
}
function nodeLibraries() {
	const listed = execFileSync("ldd", [process.execPath], { encoding: "utf8" });
	const libs = /* @__PURE__ */ new Set(["/lib64/ld-linux-x86-64.so.2"]);
	for (const line of listed.split("\n")) {
		const mapped = line.match(/=>\s+(\/\S+)/);
		const direct = line.match(/^\s*(\/\S+)\s+\(/);
		const path = mapped?.[1] ?? direct?.[1];
		if (path) libs.add(path);
	}
	return [...libs];
}
function ensureConfine() {
	const source = join(process.cwd(), "scripts/sandbox-confine.c");
	const binary = join(process.cwd(), "scripts/sandbox-confine");
	if (!existsSync(source)) throw new Error("The sandbox confine source is missing.");
	if (!existsSync(binary) || statSync(source).mtimeMs > statSync(binary).mtimeMs) execFileSync("gcc", [
		"-static",
		"-O2",
		"-s",
		"-o",
		binary,
		source
	], { stdio: "pipe" });
	if (!existsSync(binary)) throw new Error("The sandbox confine helper was not built.");
	return binary;
}
function bindReadonly(source, dest) {
	mkdirSync(join(dest, ".."), { recursive: true });
	writeFileSync(dest, "");
	execFileSync("mount", [
		"--bind",
		source,
		dest
	]);
	execFileSync("mount", [
		"-o",
		"remount,bind,ro",
		dest
	]);
}
function buildRoot(stage, runner, confine) {
	execFileSync("mount", [
		"-t",
		"tmpfs",
		"-o",
		"nosuid,nodev,size=16m,mode=755",
		"tmpfs",
		stage
	]);
	for (const dir of [
		"usr/bin",
		"lib64",
		"lib/x86_64-linux-gnu",
		"opt/nexus",
		"tmp",
		"proc",
		"dev",
		"old"
	]) mkdirSync(join(stage, dir), { recursive: true });
	bindReadonly(process.execPath, join(stage, "usr/bin/node"));
	for (const lib of nodeLibraries()) {
		if (!existsSync(lib)) continue;
		bindReadonly(lib, join(stage, lib.slice(1)));
	}
	copyFileSync(confine, join(stage, "opt/nexus/confine"));
	copyFileSync(runner, join(stage, "opt/nexus/qa-runner.mjs"));
	chmodSync(join(stage, "opt/nexus/confine"), 365);
	chmodSync(join(stage, "opt/nexus/qa-runner.mjs"), 292);
	for (const name of [
		"null",
		"zero",
		"urandom"
	]) {
		const dest = join(stage, "dev", name);
		writeFileSync(dest, "");
		execFileSync("mount", [
			"--bind",
			`/dev/${name}`,
			dest
		]);
	}
	execFileSync("mount", [
		"-o",
		"remount,nosuid,nodev,ro",
		stage
	]);
	const quota = `${Math.floor(SANDBOX.fileBytes / 1024)}k`;
	execFileSync("mount", [
		"-t",
		"tmpfs",
		"-o",
		`nosuid,nodev,noexec,size=${quota},mode=700`,
		"tmpfs",
		join(stage, "tmp")
	]);
}
function destroyRoot(stage) {
	try {
		execFileSync("umount", [
			"-R",
			"-l",
			stage
		], { stdio: "ignore" });
	} catch {}
	rmSync(stage, {
		recursive: true,
		force: true
	});
	rmSync(`${stage}-enter.sh`, { force: true });
}
function oomKills() {
	try {
		const text = readFileSync(`${BOX}/memory.events`, "utf8");
		return Number(text.match(/^oom_kill\s+(\d+)/m)?.[1] ?? 0);
	} catch {
		return 0;
	}
}
function blocked(dir, stderr) {
	return {
		code: 1,
		stdout: "",
		stderr,
		killed: false,
		dir,
		cleaned: true
	};
}
/**
* Runs Node inside a private root that contains only the interpreter, the runner,
* and a one-megabyte tmp. The host filesystem is detached. Capabilities are dropped.
* If that boundary cannot be built, the command is not started.
*/
async function runBounded(command, args, stdin = "") {
	const stage = mkdtempSync(join(tmpdir(), "nexus-qa-"));
	if (command !== process.execPath) {
		rmSync(stage, {
			recursive: true,
			force: true
		});
		return blocked(stage, "The sandbox only runs the Node checker.");
	}
	if (!prepareCgroup()) {
		rmSync(stage, {
			recursive: true,
			force: true
		});
		return blocked(stage, "memory controller unavailable");
	}
	const runner = args.find((arg) => arg.endsWith("qa-runner.mjs")) ?? "";
	let confine = "";
	try {
		confine = ensureConfine();
		if (!existsSync(runner) && args.includes(runner)) throw new Error("The sandbox runner is missing.");
		buildRoot(stage, runner || join(process.cwd(), "scripts/qa-runner.mjs"), confine);
	} catch (error) {
		destroyRoot(stage);
		return blocked(stage, error instanceof Error ? error.message : "The sandbox root could not be built.");
	}
	const enter = `${stage}-enter.sh`;
	const execArgs = ["/usr/bin/node", ...args.map((arg) => arg === runner && runner ? "/opt/nexus/qa-runner.mjs" : arg)].map(shQuote).join(" ");
	const inner = [
		"set -eu",
		"mount --make-rprivate /",
		`mount -t proc -o nosuid,nodev,noexec,hidepid=2,subset=pid proc ${shQuote(`${stage}/proc`)}`,
		`cd ${shQuote(stage)}`,
		"pivot_root . old",
		"cd /tmp",
		"unset OLDPWD",
		"export PATH=/usr/bin HOME=/tmp TMPDIR=/tmp LANG=C",
		`exec /opt/nexus/confine --enter /old ${execArgs}`
	].join("\n");
	writeFileSync(enter, inner, { mode: 493 });
	const outer = [
		`echo $$ > ${BOX}/cgroup.procs`,
		"&&",
		"exec",
		"prlimit",
		`--cpu=${SANDBOX.cpuSeconds}`,
		`--fsize=${SANDBOX.fileBytes}`,
		"--nofile=64",
		"unshare",
		"--mount",
		"--pid",
		"--fork",
		"--net",
		"--ipc",
		"--uts",
		"--propagation",
		"private",
		"/bin/sh",
		enter
	].join(" ");
	let child;
	try {
		child = spawn("/bin/sh", ["-c", outer], {
			cwd: stage,
			env: {
				PATH: "/usr/sbin:/usr/bin:/bin",
				HOME: "/tmp",
				TMPDIR: "/tmp",
				LANG: "C"
			},
			stdio: [
				"pipe",
				"pipe",
				"pipe"
			],
			detached: true
		});
	} catch (error) {
		destroyRoot(stage);
		return blocked(stage, error instanceof Error ? error.message : "The sandbox could not start.");
	}
	const killsBefore = oomKills();
	const timer = setTimeout(() => killGroup(child), SANDBOX.timeoutMs);
	let stdout = "";
	let stderr = "";
	child.stdout?.setEncoding("utf8");
	child.stderr?.setEncoding("utf8");
	child.stdout?.on("data", (chunk) => {
		stdout = (stdout + chunk).slice(0, 2e4);
	});
	child.stderr?.on("data", (chunk) => {
		stderr = (stderr + chunk).slice(0, 4e3);
	});
	const exited = new Promise((resolveExit) => {
		child.on("error", (error) => {
			stderr = (stderr + error.message).slice(0, 4e3);
			resolveExit({
				code: 1,
				signal: null
			});
		});
		child.on("close", (code, signal) => resolveExit({
			code,
			signal
		}));
	});
	try {
		child.stdin?.write(stdin);
		child.stdin?.end();
	} catch {
		killGroup(child);
	}
	const result = await exited;
	clearTimeout(timer);
	killGroup(child);
	destroyRoot(stage);
	const killed = result.signal === "SIGKILL" || result.signal === "SIGXCPU" || result.code === null || result.code === 137 || oomKills() > killsBefore;
	return {
		code: result.code,
		stdout,
		stderr,
		killed,
		dir: stage,
		cleaned: !existsSync(stage)
	};
}
var FORBIDDEN = /\bfetch\s*\(|\bWebSocket\b|\bXMLHttpRequest\b|\brequire\s*\(|\bprocess\b|\beval\s*\(|\bFunction\s*\(|document\.cookie|\blocalStorage\b|\bindexedDB\b|\bimport\s*\(|\bWorker\s*\(/;
function extractHtml(artifact) {
	const fenced = artifact.match(/```html\s*([\s\S]*?)```/i)?.[1];
	if (fenced?.includes("<")) return fenced.trim();
	const loose = artifact.match(/```\s*(<!doctype html[\s\S]*?)```/i)?.[1];
	if (loose) return loose.trim();
	if (/^<!doctype html/i.test(artifact.trim())) return artifact.trim();
	return "";
}
function sha256(value) {
	return createHash("sha256").update(value).digest("hex");
}
function sandboxFacts() {
	return `Private root, capabilities dropped, ${Math.round(SANDBOX.memoryBytes / 1048576)} MB, ${SANDBOX.cpuSeconds}s cpu, ${SANDBOX.processes} processes, ${SANDBOX.fileBytes} byte tmpfs, no network.`;
}
/** Runs the artifact under OS limits. This process never evaluates it. */
async function executeArtifact(html, objective, executionId = "") {
	const startedAt = (/* @__PURE__ */ new Date()).toISOString();
	const hash = sha256(html);
	if (!html.trim()) return report(false, hash, "No HTML artifact to execute.", [], startedAt, executionId, false);
	if (FORBIDDEN.test(html)) return report(false, hash, "Refused. The artifact asks for network, storage, or host access.", [{
		name: "No forbidden capability",
		passed: false,
		detail: "Blocked before a process was started."
	}], startedAt, executionId, false);
	const runner = resolve(process.cwd(), "scripts/qa-runner.mjs");
	if (!existsSync(runner)) return report(false, hash, "The sandbox runner is missing.", [{
		name: "Sandbox",
		passed: false,
		detail: "Runner missing."
	}], startedAt, executionId, false);
	return fromBounded(await runBounded(process.execPath, [runner], JSON.stringify({
		html,
		objective
	})), hash, startedAt, executionId);
}
function fromBounded(bounded, hash, startedAt, executionId) {
	if (existsSync(bounded.dir)) return report(false, hash, "The sandbox temp directory was not removed.", [{
		name: "Cleanup",
		passed: false,
		detail: bounded.dir
	}], startedAt, executionId, true);
	if (/isolation refused|confine:|pivot_root|memory controller unavailable|could not be built|could not be detached/i.test(bounded.stderr) && !bounded.stdout.trim()) return report(false, hash, "The sandbox boundary was not established. The artifact was not executed.", [{
		name: "OS limits",
		passed: false,
		detail: bounded.stderr.slice(0, 240) || "Isolation did not start."
	}], startedAt, executionId, false);
	if (/ENOENT|not found|prlimit|unshare/i.test(bounded.stderr) && !bounded.stdout.trim()) return report(false, hash, "OS limits could not be applied on this host. The artifact was not executed.", [{
		name: "OS limits",
		passed: false,
		detail: bounded.stderr.slice(0, 240) || "prlimit or unshare is missing."
	}], startedAt, executionId, false);
	let parsed = null;
	try {
		parsed = JSON.parse(bounded.stdout);
	} catch {
		parsed = null;
	}
	if (!parsed || !Array.isArray(parsed.tests)) {
		const detail = bounded.killed ? `The sandbox stopped the artifact. ${sandboxFacts()}` : "The sandbox did not return a test report.";
		return report(false, hash, detail, [{
			name: "Sandbox",
			passed: false,
			detail
		}], startedAt, executionId, true);
	}
	const tests = parsed.tests.filter((item) => item && typeof item.name === "string" && typeof item.passed === "boolean");
	return report(parsed.passed === true && tests.length > 0 && tests.every((item) => item.passed), hash, `${typeof parsed.detail === "string" ? parsed.detail : ""} ${sandboxFacts()}`.trim(), tests, startedAt, executionId, true);
}
function report(passed, hash, detail, tests, startedAt, executionId, enforced) {
	return {
		passed,
		sha256: hash,
		detail,
		tests,
		startedAt,
		finishedAt: (/* @__PURE__ */ new Date()).toISOString(),
		executionId,
		suite: SANDBOX.suite,
		sandbox: {
			...SANDBOX,
			enforced
		}
	};
}
function retryDelayMs(attempt) {
	const step = Math.max(0, attempt - 1);
	return Math.min(8e3, 250 * 2 ** step);
}
function nextStatus(attempt, maxAttempts = 3) {
	return attempt >= maxAttempts ? "dead" : "retry";
}
async function atomically(sql, run) {
	if (sql.transaction) return sql.transaction(run);
	return run(sql);
}
async function claimLease(sql, input) {
	return atomically(sql, async (tx) => {
		const row = (await tx`
      select status, attempt, (leased_until > now()) as wait
      from execution_jobs where assignment_id = ${input.assignmentId}
      order by created_at desc limit 1`)[0];
		if (row?.status === "dead") throw new CompanyError("This department is in the dead letter. Send it back before it can run.");
		const waiting = row?.wait === true || row?.wait === "t" || row?.wait === "true" || row?.wait === 1;
		if (row?.status === "retry" && waiting) throw new CompanyError("This department is waiting out its retry.");
		const attempt = row?.status === "retry" ? Number(row?.attempt ?? 0) + 1 : 1;
		if (!(await tx`update assignments
      set status = ${"RUNNING"}, error = ${""}, model = ${""}, run_token = ${input.fence}, updated_at = now()
      where id = ${input.assignmentId} and organization_id = ${input.orgId}
        and status in ('QUEUED', 'READY', 'FAILED')
      returning id`)[0]) throw new CompanyError("That assignment changed. Reload and try again.");
		await tx`insert into execution_jobs (
      id, organization_id, mission_id, assignment_id, fence, status, attempt, max_attempts, leased_until
    ) values (
      ${input.jobId}, ${input.orgId}, ${input.missionId}, ${input.assignmentId}, ${input.fence},
      ${"leased"}, ${attempt}, ${3}, now() + (${90} * interval '1 second')
    )`;
		return { attempt };
	});
}
async function renewLease(sql, fence) {
	const rows = await sql`update execution_jobs
    set leased_until = now() + (${90} * interval '1 second'), updated_at = now()
    where fence = ${fence} and status = ${"leased"} and leased_until > now()
    returning id`;
	return Boolean(rows[0]);
}
/** Writes only while this fence still owns an unexpired lease. */
async function commitLease(sql, fence, write) {
	return atomically(sql, async (tx) => {
		if (!(await tx`select id from execution_jobs
      where fence = ${fence} and status = ${"leased"} and leased_until > now()`)[0]) return null;
		const written = await write(tx);
		if (written == null) return null;
		await tx`update execution_jobs set status = ${"done"}, last_error = ${""}, updated_at = now()
      where fence = ${fence} and status = ${"leased"}`;
		return written;
	});
}
async function failLease(sql, fence, message) {
	return atomically(sql, async (tx) => {
		const job = (await tx`
      select attempt, max_attempts, assignment_id from execution_jobs
      where fence = ${fence} and status = ${"leased"}`)[0];
		if (!job) return "lost";
		const attempt = Number(job.attempt);
		const outcome = nextStatus(attempt, Number(job.max_attempts) || 3);
		const error = message.slice(0, 500);
		if (outcome === "dead") {
			await tx`update execution_jobs set status = ${"dead"}, last_error = ${error}, updated_at = now()
        where fence = ${fence} and status = ${"leased"}`;
			await tx`update assignments set status = ${"FAILED"}, error = ${error}, run_token = ${""}, updated_at = now()
        where id = ${job.assignment_id} and status = ${"RUNNING"} and run_token = ${fence}`;
			return "dead";
		}
		await tx`update execution_jobs
      set status = ${"retry"}, last_error = ${error}, leased_until = now() + (${Math.max(1, Math.ceil(retryDelayMs(attempt) / 1e3))} * interval '1 second'), updated_at = now()
      where fence = ${fence} and status = ${"leased"}`;
		await tx`update assignments set status = ${"READY"}, error = ${error}, model = ${""}, run_token = ${""}, updated_at = now()
      where id = ${job.assignment_id} and status = ${"RUNNING"} and run_token = ${fence}`;
		return "retry";
	});
}
async function expireLeases(sql, missionId) {
	return atomically(sql, async (tx) => {
		const rows = missionId ? await tx`update execution_jobs
          set status = ${"expired"}, updated_at = now()
          where status = ${"leased"} and leased_until < now() and mission_id = ${missionId}
          returning fence, assignment_id` : await tx`update execution_jobs
          set status = ${"expired"}, updated_at = now()
          where status = ${"leased"} and leased_until < now()
          returning fence, assignment_id`;
		for (const row of rows) await tx`update assignments
        set status = ${"READY"}, model = ${""}, run_token = ${""},
            error = ${"The lease expired before the run could save."}, updated_at = now()
        where id = ${row.assignment_id} and status = ${"RUNNING"} and run_token = ${row.fence}`;
		return rows.length;
	});
}
async function cancelLeases(sql, missionId) {
	await sql`update execution_jobs set status = ${"cancelled"}, updated_at = now()
    where mission_id = ${missionId} and status in ('leased', 'retry', 'dead')`;
}
var OPEN = /* @__PURE__ */ new Set([
	"PROPOSED",
	"PLANNED",
	"AUTHORIZED",
	"EXECUTING",
	"AWAITING_ACCEPTANCE",
	"REJECTED"
]);
function clampPriority(value) {
	if (!Number.isInteger(value) || value < 0 || value > 100) throw new Error("Priority is a whole number from 0 to 100.");
	return value;
}
/** A parent is not finished while a subordinate mission is still open. */
function childBlocksAcceptance(statuses) {
	return statuses.some((status) => status !== "ACCEPTED" && status !== "CANCELLED");
}
function deriveFindings(input) {
	const findings = [];
	const titles = /* @__PURE__ */ new Map();
	for (const mission of input.missions) {
		if (mission.status === "CANCELLED") continue;
		const key = mission.title.trim().toLowerCase();
		if (key) titles.set(key, [...titles.get(key) ?? [], mission.title]);
		if (mission.dependsOn && mission.dependencyStatus !== "ACCEPTED" && (mission.status === "AUTHORIZED" || mission.status === "EXECUTING")) findings.push({
			key: `depend:${mission.id}`,
			missionId: mission.id,
			severity: "blocking",
			title: "A dependency is not accepted",
			evidence: `${mission.title} is ${mission.status} and waits on a mission that is ${mission.dependencyStatus ?? "missing"}.`,
			recommendation: "Accept the dependency, or remove it before this mission runs.",
			confidence: "recorded",
			ownerRequired: true
		});
		if (mission.retries >= 2) findings.push({
			key: `retry:${mission.id}`,
			missionId: mission.id,
			severity: mission.retries >= 3 ? "blocking" : "watch",
			title: "A department has been retried",
			evidence: `${mission.title} has ${mission.retries} recorded attempts.`,
			recommendation: mission.retries >= 3 ? "The retry limit is exhausted. Recover it or send it back." : "Inspect the last error before another run.",
			confidence: "recorded",
			ownerRequired: mission.retries >= 3
		});
		if (mission.openDefects > 0) findings.push({
			key: `defects:${mission.id}`,
			missionId: mission.id,
			severity: "watch",
			title: "Verification defects are still open",
			evidence: `${mission.title} has ${mission.openDefects} open defect${mission.openDefects === 1 ? "" : "s"}.`,
			recommendation: "Rework the department that owns the failed check. Do not accept the packet.",
			confidence: "recorded",
			ownerRequired: false
		});
		if (mission.retries >= 2 && mission.openDefects > 0) findings.push({
			key: `repeat:${mission.id}`,
			missionId: mission.id,
			severity: "watch",
			title: "Retries and open defects are on the same mission",
			evidence: `${mission.title} has both ${mission.retries} attempts and ${mission.openDefects} open defects. That combination is consistent with a repeated failed check, not a separate measurement.`,
			recommendation: "Read the defect and the last error together before running the department again.",
			confidence: "inferred",
			ownerRequired: false
		});
		const idle = input.nowMs - mission.updatedAtMs;
		if ((mission.status === "AUTHORIZED" || mission.status === "EXECUTING") && !mission.running && idle > input.stallMs) findings.push({
			key: `stall:${mission.id}`,
			missionId: mission.id,
			severity: "watch",
			title: "Authorized work has not moved",
			evidence: `${mission.title} is ${mission.status} and its record has not changed within the stall window.`,
			recommendation: "Run the next ready department, or recover an expired lease. The scheduler will not invent a new authorization.",
			confidence: "recorded",
			ownerRequired: false
		});
		const children = input.missions.filter((row) => row.parentId === mission.id && OPEN.has(row.status));
		if (children.length > 0 && (mission.status === "AWAITING_ACCEPTANCE" || mission.status === "ACCEPTED")) findings.push({
			key: `children:${mission.id}`,
			missionId: mission.id,
			severity: "blocking",
			title: "Subordinate missions are still open",
			evidence: `${mission.title} still has open work: ${children.map((row) => row.title).join(", ")}.`,
			recommendation: "Accept or cancel the subordinate missions before treating the parent as finished.",
			confidence: "recorded",
			ownerRequired: true
		});
	}
	for (const [key, names] of titles) {
		if (names.length < 2) continue;
		findings.push({
			key: `duplicate:${key}`,
			missionId: null,
			severity: "info",
			title: "Two missions share a title",
			evidence: `${names.length} missions are titled “${names[0]}”.`,
			recommendation: "Confirm they are distinct work. Nothing is merged automatically.",
			confidence: "recorded",
			ownerRequired: false
		});
	}
	for (const entry of input.knowledge) {
		if (entry.confidence !== "contested" || entry.state === "superseded") continue;
		findings.push({
			key: `knowledge:${entry.id}`,
			missionId: null,
			severity: "watch",
			title: "Knowledge is contested",
			evidence: `“${entry.title}” disagrees with an accepted record and was not allowed to replace it.`,
			recommendation: "Resolve the conflict explicitly. The earlier decision stays in force until you do.",
			confidence: "recorded",
			ownerRequired: true
		});
	}
	return findings;
}
function measuredRate(successes, total, minimum = 5) {
	if (!Number.isInteger(total) || total < minimum || successes < 0 || successes > total) return {
		kind: "unavailable",
		sample: Math.max(0, total),
		bps: null,
		note: `Fewer than ${minimum} comparable observations. The rate is not shown.`
	};
	return {
		kind: "measured",
		sample: total,
		bps: Math.round(successes / total * 1e4),
		note: "Measured from stored records. This is not a forecast."
	};
}
function measuredDuration(samples, minimum = 5) {
	const usable = samples.filter((value) => Number.isFinite(value) && value >= 0);
	if (usable.length < minimum) return {
		kind: "unavailable",
		sample: usable.length,
		seconds: null,
		note: "Fewer than five finished missions. Duration is not shown."
	};
	const seconds = Math.round(usable.reduce((sum, value) => sum + value, 0) / usable.length);
	return {
		kind: "measured",
		sample: usable.length,
		seconds,
		note: "Average of stored start and acceptance times. It is not a promise about the next mission."
	};
}
function requirementVerdict(input) {
	if (input.qaStatus === "passed" && input.artifactSha !== "" && input.qaSha === input.artifactSha && input.accepted) return {
		complete: true,
		reason: "The owner accepted a packet whose quality report names this artifact."
	};
	if (input.agentDone) return {
		complete: false,
		reason: "An agent completion report is not acceptance. The requirement stays open."
	};
	return {
		complete: false,
		reason: "The chain is missing a matching quality report or owner acceptance."
	};
}
var AUTONOMOUS = /* @__PURE__ */ new Set([
	"release_expired_lease",
	"recalculate_metrics",
	"diagnostic"
]);
var OWNER = /* @__PURE__ */ new Set([
	"deploy",
	"delete",
	"permission",
	"credential",
	"finance",
	"external_write",
	"policy",
	"accepted_outcome"
]);
function maintenanceClass(kind) {
	if (AUTONOMOUS.has(kind)) return {
		risk: "low",
		autonomous: true
	};
	if (OWNER.has(kind)) return {
		risk: "high",
		autonomous: false
	};
	return {
		risk: "high",
		autonomous: false
	};
}
function recommend(input) {
	const notes = [];
	if (input.qaFailBps != null && input.qaFailBps >= 5e3) notes.push({
		text: "Half or more of the stored quality reports failed. Read those reports before another run. The budget and the scheduler were not changed.",
		changesPolicy: false
	});
	if (input.retries >= 3) notes.push({
		text: "Three or more retries are on record. Inspect the last error. Nothing was requeued by this recommendation.",
		changesPolicy: false
	});
	if (input.blocked > 0) notes.push({
		text: `${input.blocked} authorized mission${input.blocked === 1 ? "" : "s"} still wait on an unaccepted dependency. Accept or remove the dependency. No new authorization was created.`,
		changesPolicy: false
	});
	if (notes.length === 0) notes.push({
		text: "No redistribution is recommended from the current sample. Absence of a recommendation is not a performance claim.",
		changesPolicy: false
	});
	return notes;
}
function githubHealth(input) {
	if (!(input.status === "connected")) return {
		connected: false,
		stale: false,
		note: "GitHub is not connected. No sync health is claimed."
	};
	const windowMs = Math.max(1, input.pollMinutes) * 6e4;
	const stale = input.lastSyncMs == null || input.nowMs - input.lastSyncMs >= windowMs;
	return {
		connected: true,
		stale,
		note: stale ? "The last stored sync is older than the recorded interval. Nothing was fetched by this check." : "The last stored sync is inside the recorded interval. This is not continuous monitoring."
	};
}
function contentHash(body) {
	return createHash("sha256").update(body.replace(/\s+/g, " ").trim()).digest("hex");
}
function requirementsOf(body) {
	const seen = /* @__PURE__ */ new Set();
	const requirements = [];
	for (const line of body.split("\n")) {
		const text = line.replace(/\s+/g, " ").trim();
		if (text.length < 8) continue;
		const id = `req_${contentHash(text).slice(0, 12)}`;
		if (seen.has(id)) continue;
		seen.add(id);
		requirements.push({
			id,
			text
		});
	}
	return requirements;
}
function diffRequirements(before, after) {
	const afterIds = new Set(after.map((item) => item.id));
	const beforeIds = new Set(before.map((item) => item.id));
	return {
		added: after.filter((item) => !beforeIds.has(item.id)),
		removed: before.filter((item) => !afterIds.has(item.id)),
		unchanged: after.filter((item) => beforeIds.has(item.id))
	};
}
function traceImpact(input) {
	const changed = [...input.added, ...input.removed].map((item) => item.text.toLowerCase());
	const direct = input.assignments.filter((row) => {
		const haystack = `${row.brief}\n${row.artifact}`.toLowerCase();
		return changed.some((line) => haystack.includes(line));
	});
	const earliest = direct.reduce((min, row) => Math.min(min, row.position), Number.POSITIVE_INFINITY);
	const affected = input.assignments.filter((row) => direct.some((item) => item.id === row.id) || Number.isFinite(earliest) && row.position > earliest && row.status === "DONE");
	const affectedIds = affected.map((row) => row.id);
	return {
		affectedIds,
		untouchedIds: input.assignments.filter((row) => !affectedIds.includes(row.id)).map((row) => row.id),
		departments: [...new Set(affected.map((row) => row.department))]
	};
}
function budgetDecision(input) {
	if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) return {
		allow: false,
		reason: "The amount is not a positive number of cents.",
		remainingCents: null,
		utilization: null
	};
	const spent = input.companySpent + input.companyReserved;
	const utilization = input.ceilingCents != null && input.ceilingCents > 0 ? spent / input.ceilingCents : null;
	const remainingCents = input.ceilingCents == null ? null : input.ceilingCents - spent;
	if (input.kind === "estimate") return {
		allow: true,
		reason: "An estimate is recorded and does not consume the budget.",
		remainingCents,
		utilization
	};
	if (input.ceilingCents != null && spent + input.amountCents > input.ceilingCents) return {
		allow: false,
		reason: "That amount is above the spending ceiling.",
		remainingCents,
		utilization
	};
	if (input.missionBudgetCents != null && input.missionSpent + input.missionReserved + input.amountCents > input.missionBudgetCents) return {
		allow: false,
		reason: "That amount is above the mission budget.",
		remainingCents,
		utilization
	};
	if (input.departmentBudgetCents != null && input.departmentSpent + input.departmentReserved + input.amountCents > input.departmentBudgetCents) return {
		allow: false,
		reason: "That amount is above the department allocation.",
		remainingCents,
		utilization
	};
	if (input.ceilingCents == null) return {
		allow: true,
		reason: "No spending ceiling is set. The amount is recorded. Remaining budget is unavailable.",
		remainingCents: null,
		utilization: null
	};
	return {
		allow: true,
		reason: "Within the authorized ceiling.",
		remainingCents: input.ceilingCents - spent - input.amountCents,
		utilization
	};
}
function ownerMaySetCeiling(role) {
	return role === "owner";
}
function reliabilityOf(rows, minimum = 5) {
	const attempts = rows.filter((row) => row.outcome === "succeeded" || row.outcome === "failed" || row.outcome === "timeout");
	const withheld = rows.filter((row) => row.outcome === "withheld").length;
	const unspecified = rows.filter((row) => row.outcome === "unspecified").length;
	const ordered = [...rows].sort((a, b) => a.at.localeCompare(b.at));
	const durations = attempts.map((row) => row.durationMs).filter((value) => value != null && value >= 0).sort((a, b) => a - b);
	const measured = attempts.length >= minimum;
	const succeeded = attempts.filter((row) => row.outcome === "succeeded").length;
	const failed = attempts.filter((row) => row.outcome === "failed").length;
	const timeouts = attempts.filter((row) => row.outcome === "timeout").length;
	if (rows.length === 0) return {
		attempts: 0,
		withheld: 0,
		unspecified: 0,
		successRate: null,
		failureRate: null,
		timeoutRate: null,
		averageMs: null,
		p95Ms: null,
		periodStart: null,
		periodEnd: null,
		lastOutcome: null,
		measured: false,
		note: "No dispatches are recorded. That is not evidence the provider is available."
	};
	return {
		attempts: attempts.length,
		withheld,
		unspecified,
		successRate: measured ? succeeded / attempts.length : null,
		failureRate: measured ? failed / attempts.length : null,
		timeoutRate: measured ? timeouts / attempts.length : null,
		averageMs: measured && durations.length >= minimum ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : null,
		p95Ms: measured && durations.length >= minimum ? durations[Math.min(durations.length - 1, Math.ceil(durations.length * .95) - 1)] ?? null : null,
		periodStart: ordered[0]?.at ?? null,
		periodEnd: ordered[ordered.length - 1]?.at ?? null,
		lastOutcome: ordered[ordered.length - 1]?.outcome ?? null,
		measured,
		note: measured ? "Rates use recorded attempts only. Withheld calls and rows without an outcome are not treated as uptime." : `Fewer than ${minimum} attempts with an outcome. Rates are not shown.`
	};
}
function usablePrice(price, now) {
	if (!price) return null;
	if (price.status !== "verified") return null;
	if (price.reviewAt <= now) return null;
	return price;
}
function quoteCost(input) {
	const price = usablePrice(input.price, input.now);
	if (!price) return {
		kind: "unknown",
		cents: null,
		pricingVersion: input.price?.version ?? null,
		reason: "No current verified price. The cost is unknown, not zero."
	};
	const parts = [
		[input.inputTokens, price.inputCentsPerMillion],
		[input.outputTokens, price.outputCentsPerMillion],
		[input.cachedTokens, price.cachedCentsPerMillion]
	];
	if (parts.some(([tokens, rate]) => tokens == null || rate == null)) return {
		kind: "unknown",
		cents: null,
		pricingVersion: price.version,
		reason: "Usage or a price dimension is missing. Missing usage is not treated as zero."
	};
	return {
		kind: "estimate",
		cents: parts.reduce((sum, [tokens, rate]) => sum + Math.round((tokens ?? 0) * (rate ?? 0) / 1e6), 0),
		pricingVersion: price.version,
		reason: "Estimate from the verified price and the reported token counts. This is not an invoice."
	};
}
function unpricedDispatch(policy, kind) {
	if (kind !== "unknown") return {
		allow: true,
		reason: "A priced estimate is on record."
	};
	if (policy === "refuse") return {
		allow: false,
		reason: "The owner requires a verified price before an external call."
	};
	return {
		allow: true,
		reason: "The call is allowed and its cost stays unknown."
	};
}
function forecastCost(samples) {
	const known = samples.map((row) => row.cents).filter((value) => value != null && value >= 0);
	if (known.length < 5) return {
		available: false,
		expectedCents: null,
		lowCents: null,
		highCents: null,
		sample: known.length,
		note: "Fewer than five priced executions. The forecast is unavailable."
	};
	const sorted = [...known].sort((a, b) => a - b);
	return {
		available: true,
		expectedCents: Math.round(sorted.reduce((sum, value) => sum + value, 0) / sorted.length),
		lowCents: sorted[0] ?? null,
		highCents: sorted[sorted.length - 1] ?? null,
		sample: sorted.length,
		note: "Range is the lowest and highest recorded estimate. It is not a provider quote."
	};
}
function tokens(text) {
	return new Set(text.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length >= 4));
}
function jaccard(left, right) {
	if (left.size === 0 || right.size === 0) return 0;
	let shared = 0;
	for (const word of left) if (right.has(word)) shared += 1;
	return shared / (/* @__PURE__ */ new Set([...left, ...right])).size;
}
function relateRequirements(before, after) {
	const usedBefore = /* @__PURE__ */ new Set();
	const unchanged = [];
	const remaining = [];
	const beforeByText = new Map(before.map((row) => [row.text, row]));
	for (const row of after) {
		const exact = beforeByText.get(row.text);
		if (exact && !usedBefore.has(exact.key)) {
			usedBefore.add(exact.key);
			unchanged.push({
				key: exact.key,
				text: row.text
			});
		} else remaining.push(row);
	}
	const modified = [];
	const added = [];
	const ambiguous = [];
	const openBefore = before.filter((row) => !usedBefore.has(row.key));
	for (const row of remaining) {
		const scored = openBefore.filter((prior) => !usedBefore.has(prior.key)).map((prior) => ({
			prior,
			score: jaccard(tokens(prior.text), tokens(row.text))
		})).filter((item) => item.score >= .5).sort((a, b) => b.score - a.score);
		const best = scored[0];
		const second = scored[1];
		if (!best) added.push(row);
		else if (second && best.score - second.score < .1) ambiguous.push(row);
		else {
			usedBefore.add(best.prior.key);
			modified.push({
				key: best.prior.key,
				text: row.text,
				priorKey: best.prior.key
			});
		}
	}
	return {
		unchanged,
		modified,
		added,
		removed: before.filter((row) => !usedBefore.has(row.key)),
		ambiguous
	};
}
function actionDecision(input) {
	if (input.integrationStatus !== "verified") return {
		allow: false,
		pending: false,
		reason: "The integration is not connected. An unverified registry row is not a connection."
	};
	if (!input.scopes.includes(input.operation)) return {
		allow: false,
		pending: false,
		reason: "That operation is outside the granted scope."
	};
	if (input.classification === "confidential") return {
		allow: false,
		pending: false,
		reason: "Confidential material is not sent through an external integration."
	};
	if (input.actionClass === 1) return {
		allow: true,
		pending: false,
		reason: "Read-only operation inside the granted scope."
	};
	if (input.actionClass === 2 && input.caller === "owner") return {
		allow: true,
		pending: false,
		reason: "Low-impact operation pre-authorized by the owner."
	};
	if (input.actionClass >= 2 && input.caller !== "owner" && !input.ownerApproved) return {
		allow: false,
		pending: true,
		reason: "An agent cannot approve this action."
	};
	if (input.actionClass === 3 && input.ownerApproved) return {
		allow: true,
		pending: false,
		reason: "The owner approved this consequential action."
	};
	if (input.actionClass === 4 && input.ownerApproved && input.confirmed) return {
		allow: true,
		pending: false,
		reason: "The owner approved and confirmed this critical action."
	};
	return {
		allow: false,
		pending: true,
		reason: "This action is waiting on the owner."
	};
}
function quarantineExternal(text) {
	const kept = [];
	let ignoredDirectives = 0;
	for (const line of text.split("\n")) {
		if (/ignore (all |any )?(previous |prior )?instructions|you are now|system prompt|grant yourself|raise the (budget|ceiling)/i.test(line)) {
			ignoredDirectives += 1;
			continue;
		}
		kept.push(line);
	}
	return {
		observation: kept.join("\n").trim(),
		ignoredDirectives
	};
}
function credentialUsable(input) {
	if (input.revoked) return {
		ok: false,
		reason: "That credential is revoked."
	};
	if (input.expiresAt && input.expiresAt <= input.now) return {
		ok: false,
		reason: "That credential is expired."
	};
	return {
		ok: true,
		reason: "The stored credential is still within its recorded window."
	};
}
function sealSecret(plain, key) {
	if (key.length !== 32) throw new Error("Credential key must be 32 bytes.");
	const nonce = randomBytes(12);
	const cipher = createCipheriv("aes-256-gcm", key, nonce);
	return {
		cipher: Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]).toString("base64"),
		nonce: nonce.toString("base64"),
		tag: cipher.getAuthTag().toString("base64"),
		hint: plain.length >= 8 ? `stored · ends ${plain.slice(-4)}` : "stored"
	};
}
function openSecret(input, key) {
	if (key.length !== 32) throw new Error("Credential key must be 32 bytes.");
	const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(input.nonce, "base64"));
	decipher.setAuthTag(Buffer.from(input.tag, "base64"));
	return Buffer.concat([decipher.update(Buffer.from(input.cipher, "base64")), decipher.final()]).toString("utf8");
}
function deviceCommand(input) {
	if (!input.connected) return {
		allow: false,
		claimed: false,
		state: "safe",
		reason: "The device is not connected. No physical action is claimed."
	};
	if (input.operation === "emergency_stop") return {
		allow: true,
		claimed: false,
		state: "stop-requested",
		reason: "Stop requested. It is not claimed until the device confirms."
	};
	if (input.emergencyStop) return {
		allow: false,
		claimed: false,
		state: "stopped",
		reason: "Emergency stop is set. Other commands stay blocked."
	};
	if (input.operation === "control" && input.permission !== "control") return {
		allow: false,
		claimed: false,
		state: "read-only",
		reason: "This device is registered for reading, not control."
	};
	if (input.operation === "control" && !input.ownerApproved) return {
		allow: false,
		claimed: false,
		state: "held",
		reason: "A control command needs the owner."
	};
	return {
		allow: true,
		claimed: false,
		state: "requested",
		reason: "The command is recorded. It is not claimed until the device confirms."
	};
}
function connectionLabel(status) {
	return status === "verified" ? "connected" : "not connected";
}
var GITHUB_READ_SCOPES = [
	"read:user",
	"user:email",
	"read:org",
	"read:public_key",
	"read:gpg_key"
];
var GITHUB_READ_OPERATIONS = [
	"user",
	"repos",
	"repo",
	"branches",
	"commits",
	"pulls",
	"issues",
	"workflows"
];
var GITHUB_WRITE_OPERATIONS = [
	"create_repo",
	"create_branch",
	"update_file",
	"create_commit",
	"create_pull",
	"create_issue",
	"update_issue",
	"dispatch_workflow",
	"delete_repo",
	"change_permission",
	"create_deployment"
];
var DEPARTMENTS = /* @__PURE__ */ new Set([
	"research",
	"engineering",
	"quality",
	"executive"
]);
var GithubRefusal = class extends Error {
	constructor(message) {
		super(message);
		this.name = "GithubRefusal";
	}
};
function readCredentialKey(value) {
	const raw = value?.trim() ?? "";
	if (!raw) return null;
	if (/^[0-9a-f]{64}$/i.test(raw)) return Buffer.from(raw, "hex");
	try {
		const decoded = Buffer.from(raw, "base64");
		return decoded.length === 32 ? decoded : null;
	} catch {
		return null;
	}
}
function scopeDecision(header) {
	if (header == null || header.trim() === "") return {
		ok: false,
		scopes: [],
		reason: "GitHub did not list scopes. A token without a read-only scope list is not stored and is not marked connected."
	};
	const scopes = header.split(",").map((item) => item.trim()).filter(Boolean);
	const allowed = new Set(GITHUB_READ_SCOPES);
	const rejected = scopes.filter((scope) => !allowed.has(scope));
	if (scopes.length === 0 || rejected.length > 0) return {
		ok: false,
		scopes,
		reason: rejected.length > 0 ? `These scopes are not read-only, so the token was not stored: ${rejected.join(", ")}.` : "GitHub did not list scopes. A token without a read-only scope list is not stored and is not marked connected."
	};
	return {
		ok: true,
		scopes,
		reason: "Every listed scope is on the read-only list."
	};
}
function githubPath(operation, resource, page = 1) {
	if (GITHUB_WRITE_OPERATIONS.includes(operation)) throw new GithubRefusal("That GitHub operation writes. This connector does not send it.");
	if (!GITHUB_READ_OPERATIONS.includes(operation)) throw new GithubRefusal("That GitHub operation is not on the read list.");
	const safePage = Number.isInteger(page) && page > 0 && page < 1e3 ? page : 1;
	if (operation === "user") return "https://api.github.com/user";
	if (operation === "repos") return `https://api.github.com/user/repos?per_page=30&page=${safePage}&visibility=public`;
	const repo = parseRepo(resource);
	if (operation === "repo") return `https://api.github.com/repos/${repo}`;
	const suffix = operation === "branches" ? "branches" : operation === "commits" ? "commits" : operation === "pulls" ? "pulls?state=all" : operation === "issues" ? "issues?state=all" : "actions/runs";
	return `https://api.github.com/repos/${repo}/${suffix}${suffix.includes("?") ? "&" : "?"}per_page=30&page=${safePage}`;
}
function parseRepo(resource) {
	const match = resource.trim().match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
	if (!match?.[1] || !match[2] || match[1] === "." || match[2] === "." || match[1] === ".." || match[2] === "..") throw new GithubRefusal("Name the repository as owner/name.");
	return `${match[1]}/${match[2]}`;
}
function repoAllowed(account, allowed, resource) {
	let owner = "";
	let name = "";
	try {
		const parsed = parseRepo(resource);
		owner = parsed.split("/")[0] ?? "";
		name = parsed.split("/")[1] ?? "";
	} catch {
		return {
			ok: false,
			reason: "Name the repository as owner/name."
		};
	}
	const list = allowed.split(",").map((item) => item.trim()).filter(Boolean);
	if (list.length === 0) {
		if (owner.toLowerCase() !== account.toLowerCase()) return {
			ok: false,
			reason: "No extra repositories are authorized. This connector can read the authenticated account's own public repositories."
		};
		return {
			ok: true,
			reason: "The repository belongs to the authenticated account."
		};
	}
	const needle = `${owner}/${name}`.toLowerCase();
	if (!list.some((item) => item.toLowerCase() === needle)) return {
		ok: false,
		reason: "That repository is outside the authorized list."
	};
	return {
		ok: true,
		reason: "The repository is on the authorized list."
	};
}
function rateAllows(remaining, reset, now) {
	if (remaining !== "0") return {
		ok: true,
		reason: "No stored rate limit is exhausted."
	};
	const numeric = Number(reset);
	const resetAt = Number.isFinite(numeric) && numeric > 1e10 ? numeric : Number.isFinite(numeric) && numeric > 0 ? numeric * 1e3 : Date.parse(reset);
	if (Number.isFinite(resetAt) && resetAt > now) return {
		ok: false,
		reason: "GitHub's stored rate limit is exhausted. The call was not sent."
	};
	return {
		ok: true,
		reason: "The stored rate window has passed."
	};
}
async function githubCall(input) {
	const url = githubPath(input.operation, input.resource, input.page ?? 1);
	const headers = {
		accept: "application/vnd.github+json",
		"user-agent": "nexus-github-readonly",
		"x-github-api-version": "2022-11-28"
	};
	if (input.token) headers.authorization = `Bearer ${input.token}`;
	if (input.etag) headers["if-none-match"] = input.etag;
	let response = await input.fetchImpl(url, { headers });
	if (response.status === 502 || response.status === 503 || response.status === 504) response = await input.fetchImpl(url, { headers });
	return {
		url,
		response
	};
}
function readItems(operation, body) {
	let parsed;
	try {
		parsed = JSON.parse(body);
	} catch {
		return {
			ids: [],
			private: false,
			note: "GitHub's response was not JSON. Nothing was accepted as knowledge."
		};
	}
	const rows = Array.isArray(parsed) ? parsed : [parsed];
	const ids = [];
	let isPrivate = false;
	const notes = [];
	for (const row of rows) {
		if (!row || typeof row !== "object") continue;
		const record = row;
		if (record.private === true) isPrivate = true;
		const id = typeof record.sha === "string" ? record.sha : typeof record.full_name === "string" ? record.full_name : typeof record.login === "string" ? record.login : typeof record.number === "number" ? String(record.number) : typeof record.id === "number" ? String(record.id) : "";
		if (id) ids.push(id);
		const text = [
			record.title,
			record.message,
			record.body,
			record.name
		].filter((item) => typeof item === "string").join("\n");
		if (text) notes.push(text);
	}
	const quarantined = quarantineExternal(notes.join("\n"));
	const note = isPrivate ? "A private repository was returned. Its contents are not shown and are not sent to a model." : quarantined.observation.slice(0, 240);
	return {
		ids,
		private: isPrivate,
		note
	};
}
function pollDue(lastSync, minutes, now) {
	if (!lastSync) return true;
	const at = Date.parse(lastSync);
	if (!Number.isFinite(at)) return true;
	return now - at >= minutes * 6e4;
}
function gid(prefix) {
	return `${prefix}_${randomBytes(8).toString("hex")}`;
}
function hash(value) {
	return createHash("sha256").update(value).digest("hex");
}
async function auditGithub(sql, orgId, actorId, action, target, to, detail) {
	await sql`insert into audit_events (
    id, organization_id, project_id, task_id, actor_id, actor_kind, action, target, from_state, to_state, detail
  ) values (
    ${gid("aud")}, ${orgId}, ${null}, ${null}, ${actorId}, ${"human"}, ${action}, ${target}, ${null}, ${to}, ${detail.slice(0, 500)}
  )`;
}
async function connectGithubAccount(sql, input) {
	const token = input.token.trim();
	if (!token || token.length > 300 || /[\r\n]/.test(token)) throw new GithubRefusal("The token is missing or not usable. Nothing was sent and nothing was stored.");
	if (!input.key) throw new GithubRefusal("Credential storage is not configured. Set NEXUS_CREDENTIAL_KEY. Nothing was sent and nothing was stored.");
	const existing = await sql`select id, integration_id from github_connections
    where organization_id = ${input.orgId} and status <> ${"revoked"} order by updated_at desc limit 1`;
	let integrationId = existing[0]?.integration_id ?? "";
	let connectionId = existing[0]?.id ?? "";
	if (!integrationId) {
		integrationId = gid("int");
		connectionId = gid("ghc");
		await sql`insert into integrations (
      id, organization_id, name, provider, category, status, auth_method, scopes
    ) values (
      ${integrationId}, ${input.orgId}, ${"GitHub"}, ${"github"}, ${"software"}, ${"unverified"}, ${"bearer"}, ${""}
    )`;
		await sql`insert into github_connections (
      id, organization_id, integration_id, status, allowed_repos
    ) values (
      ${connectionId}, ${input.orgId}, ${integrationId}, ${"authentication_pending"}, ${input.allowedRepos.slice(0, 500)}
    )`;
	} else await sql`update github_connections set status = ${"authentication_pending"}, allowed_repos = ${input.allowedRepos.slice(0, 500)}, updated_at = now()
      where id = ${connectionId} and organization_id = ${input.orgId}`;
	let response;
	try {
		response = (await githubCall({
			operation: "user",
			resource: "",
			token,
			fetchImpl: input.fetchImpl
		})).response;
	} catch (error) {
		const reason = error instanceof GithubRefusal ? error.message : "GitHub could not be reached. The token was not stored.";
		await sql`update github_connections set status = ${"authentication_failed"}, last_failure = ${reason}, last_failure_at = now(), updated_at = now()
      where id = ${connectionId}`;
		throw new GithubRefusal(reason);
	}
	const scopes = scopeDecision(response.headers["x-oauth-scopes"]);
	if (response.status !== 200 || !scopes.ok) {
		const reason = response.status === 401 ? "GitHub rejected that token. Nothing was stored." : response.status !== 200 ? `GitHub returned ${response.status}. The token was not stored.` : scopes.reason;
		await sql`update github_connections set status = ${"authentication_failed"}, last_failure = ${reason}, last_failure_at = now(), updated_at = now()
      where id = ${connectionId}`;
		await auditGithub(sql, input.orgId, input.userId, "github.auth_failed", connectionId, "authentication_failed", reason);
		throw new GithubRefusal(reason);
	}
	const login = readItems("user", response.body).ids[0] ?? "";
	const sealed = sealSecret(token, input.key);
	await sql`insert into integration_secrets (integration_id, organization_id, cipher, nonce, tag, hint)
    values (${integrationId}, ${input.orgId}, ${sealed.cipher}, ${sealed.nonce}, ${sealed.tag}, ${sealed.hint})
    on conflict (integration_id) do update set cipher = ${sealed.cipher}, nonce = ${sealed.nonce}, tag = ${sealed.tag}, hint = ${sealed.hint}, revoked_at = ${null}`;
	await sql`update integrations set status = ${"verified"}, scopes = ${scopes.scopes.join(",")} where id = ${integrationId} and organization_id = ${input.orgId}`;
	await sql`update github_connections set
    status = ${"connected"}, account_login = ${login}, scopes = ${scopes.scopes.join(",")}, credential_hint = ${sealed.hint},
    rate_remaining = ${response.headers["x-ratelimit-remaining"] ?? ""}, rate_reset = ${response.headers["x-ratelimit-reset"] ?? ""},
    last_success_at = now(), last_failure = ${""}, updated_at = now()
    where id = ${connectionId}`;
	await auditGithub(sql, input.orgId, input.userId, "github.connected", connectionId, "connected", `GitHub account ${login} listed read-only scopes. The token is not in this record.`);
	return { status: "connected" };
}
async function revokeGithubAccount(sql, input) {
	const row = (await sql`select id, integration_id from github_connections
    where organization_id = ${input.orgId} order by updated_at desc limit 1`)[0];
	if (!row) throw new GithubRefusal("GitHub is not registered for this company.");
	await sql`update integration_secrets set cipher = ${""}, nonce = ${""}, tag = ${""}, hint = ${"revoked"}, revoked_at = now()
    where integration_id = ${row.integration_id} and organization_id = ${input.orgId}`;
	await sql`update integrations set status = ${"revoked"} where id = ${row.integration_id} and organization_id = ${input.orgId}`;
	await sql`update github_connections set status = ${input.mode}, credential_hint = ${"revoked"}, updated_at = now() where id = ${row.id}`;
	await auditGithub(sql, input.orgId, input.userId, "github.revoked", row.id, input.mode, "The stored credential was wiped. No further GitHub call will use it.");
}
async function readGithub(sql, input) {
	if (GITHUB_WRITE_OPERATIONS.includes(input.operation)) throw new GithubRefusal("That GitHub operation writes. No request was sent.");
	if (!DEPARTMENTS.has(input.department)) throw new GithubRefusal("That department cannot request GitHub reads.");
	if (!input.key) throw new GithubRefusal("Credential storage is not configured. The read was not sent.");
	const connection = (await sql`select id, integration_id, status, account_login, allowed_repos, rate_remaining, rate_reset from github_connections
    where organization_id = ${input.orgId} order by updated_at desc limit 1`)[0];
	if (!connection || connection.status !== "connected") throw new GithubRefusal("GitHub is not connected. The read was not sent.");
	const stored = (await sql`select cipher, nonce, tag, revoked_at from integration_secrets
    where integration_id = ${connection.integration_id} and organization_id = ${input.orgId} limit 1`)[0];
	const usable = credentialUsable({
		revoked: Boolean(stored?.revoked_at),
		expiresAt: null,
		now: (/* @__PURE__ */ new Date()).toISOString()
	});
	if (!stored || !usable.ok || !stored.cipher) throw new GithubRefusal("The GitHub credential is revoked. The read was not sent.");
	const gate = rateAllows(connection.rate_remaining, connection.rate_reset, input.now ?? Date.now());
	if (!gate.ok) throw new GithubRefusal(gate.reason);
	if (input.operation !== "user" && input.operation !== "repos") {
		const allowed = repoAllowed(connection.account_login, connection.allowed_repos, input.resource);
		if (!allowed.ok) throw new GithubRefusal(allowed.reason);
	}
	const resourceKey = `${input.operation}:${input.resource}:${input.page ?? 1}`;
	const prior = await sql`select etag, body_sha256 from github_sync_marks
    where connection_id = ${connection.id} and resource_key = ${resourceKey} limit 1`;
	const token = openSecret(stored, input.key);
	let called;
	try {
		called = await githubCall({
			operation: input.operation,
			resource: input.resource,
			token,
			page: input.page,
			etag: prior[0]?.etag,
			fetchImpl: input.fetchImpl
		});
	} catch (error) {
		const reason = error instanceof GithubRefusal ? error.message : "GitHub could not be reached.";
		await sql`update github_connections set last_failure = ${reason}, last_failure_at = now(), updated_at = now() where id = ${connection.id}`;
		throw new GithubRefusal(reason);
	}
	const response = called.response;
	if (response.status === 401) {
		await revokeGithubAccount(sql, {
			orgId: input.orgId,
			userId: input.userId,
			mode: "revoked"
		});
		throw new GithubRefusal("GitHub rejected the stored token. It has been wiped.");
	}
	const bodyHash = hash(response.body);
	const duplicate = response.status === 304 || prior[0]?.body_sha256 === bodyHash && response.status === 200;
	const items = response.status === 200 ? readItems(input.operation, response.body) : {
		ids: [],
		private: false,
		note: ""
	};
	const classification = items.private ? "confidential" : "internal";
	const result = duplicate ? "duplicate" : response.status === 200 ? "retrieved" : "failed";
	await sql`insert into github_reads (
    id, organization_id, connection_id, mission_id, department_slug, operation, resource, http_status, result, body_sha256, classification
  ) values (
    ${gid("ghr")}, ${input.orgId}, ${connection.id}, ${input.missionId || null}, ${input.department}, ${input.operation}, ${input.resource.slice(0, 200)},
    ${response.status}, ${result}, ${bodyHash}, ${classification}
  )`;
	if (!duplicate && response.status === 200 && items.note && !items.private) await sql`insert into observations (
      id, organization_id, mission_id, source, reference, body, content_sha256, classification, status
    ) values (
      ${gid("obs")}, ${input.orgId}, ${input.missionId || null}, ${"github"}, ${input.resource.slice(0, 300)}, ${items.note}, ${hash(items.note)}, ${classification}, ${"observed"}
    )`;
	if (input.operation === "repos" && response.status === 200) await storeRepos(sql, input.orgId, connection.id, response.body);
	await sql`insert into github_sync_marks (connection_id, resource_key, body_sha256, item_ids, etag)
    values (${connection.id}, ${resourceKey}, ${bodyHash}, ${JSON.stringify(items.ids)}, ${response.headers.etag ?? prior[0]?.etag ?? ""})
    on conflict (connection_id, resource_key) do update set body_sha256 = ${bodyHash}, item_ids = ${JSON.stringify(items.ids)}, etag = ${response.headers.etag ?? prior[0]?.etag ?? ""}, synced_at = now()`;
	if (response.status === 200 || response.status === 304) await sql`update github_connections set
      rate_remaining = ${response.headers["x-ratelimit-remaining"] ?? connection.rate_remaining},
      rate_reset = ${response.headers["x-ratelimit-reset"] ?? connection.rate_reset},
      last_success_at = now(), last_sync_at = now(), last_failure = ${""}, updated_at = now()
      where id = ${connection.id}`;
	else await sql`update github_connections set
      rate_remaining = ${response.headers["x-ratelimit-remaining"] ?? connection.rate_remaining},
      rate_reset = ${response.headers["x-ratelimit-reset"] ?? connection.rate_reset},
      last_failure = ${`GitHub returned ${response.status}.`}, last_failure_at = now(), updated_at = now()
      where id = ${connection.id}`;
	await auditGithub(sql, input.orgId, input.userId, "github.read", connection.id, result, `${input.department} ${input.operation} ${input.resource} status ${response.status}. The token and the response body are not in this record.`);
	return {
		result,
		classification
	};
}
async function storeRepos(sql, orgId, connectionId, body) {
	let parsed;
	try {
		parsed = JSON.parse(body);
	} catch {
		return;
	}
	if (!Array.isArray(parsed)) return;
	for (const row of parsed) {
		if (!row || typeof row !== "object") continue;
		const record = row;
		const [owner, name] = (typeof record.full_name === "string" ? record.full_name : "").split("/");
		if (!owner || !name || typeof record.id !== "number") continue;
		await sql`insert into github_repos (
      id, organization_id, connection_id, owner_name, repo_name, external_id, private, default_branch
    ) values (
      ${gid("ghrepo")}, ${orgId}, ${connectionId}, ${owner}, ${name}, ${String(record.id)}, ${record.private === true},
      ${typeof record.default_branch === "string" ? record.default_branch : ""}
    ) on conflict (connection_id, external_id) do update set private = ${record.private === true}, default_branch = ${typeof record.default_branch === "string" ? record.default_branch : ""}, updated_at = now()`;
	}
}
async function liveGithubFetch(url, init) {
	const response = await fetch(url, { headers: init.headers });
	const headers = {};
	response.headers.forEach((value, key) => {
		headers[key.toLowerCase()] = value;
	});
	return {
		status: response.status,
		headers,
		body: await response.text()
	};
}
/** In-memory mission status changes only after the write that represents the commit has returned. */
function applyTransition(mission, to, write) {
	write();
	mission.status = to;
}
function requireOwner(role) {
	if (role !== "owner") throw new CompanyError("Only the owner can link a task to a mission.");
}
async function linkTaskToMission(sql, input) {
	if (input.actorId.startsWith("svc:")) throw new CompanyError("An agent cannot link a task to a mission.");
	if ((await sql`insert into mission_links (id, organization_id, mission_id, task_id, linked_by)
    select ${input.linkId}, m.organization_id, m.id, t.id, ${input.actorId}
    from missions m
    join tasks t on t.organization_id = m.organization_id and t.id = ${input.taskId}
    where m.id = ${input.missionId} and m.organization_id = ${input.orgId}
    on conflict (organization_id, mission_id, task_id) do nothing
    returning id`)[0]) return "created";
	if ((await sql`select id from mission_links
    where organization_id = ${input.orgId} and mission_id = ${input.missionId} and task_id = ${input.taskId} limit 1`)[0]) return "exists";
	throw new CompanyError("That task is not in this company. Nothing was linked.");
}
async function unlinkTaskFromMission(sql, input) {
	if (input.actorId.startsWith("svc:")) throw new CompanyError("An agent cannot remove a task link.");
	if (!(await sql`delete from mission_links
    where organization_id = ${input.orgId} and mission_id = ${input.missionId} and task_id = ${input.taskId}
    returning id`)[0]) throw new CompanyError("That link is not in this company. Nothing was removed.");
}
async function missionTaskLinks(sql, orgId, missionId) {
	return (await sql`
    select t.id as task_id, t.objective, t.state, p.name as project_name
    from mission_links l
    join tasks t on t.id = l.task_id and t.organization_id = l.organization_id
    join projects p on p.id = t.project_id and p.organization_id = l.organization_id
    where l.organization_id = ${orgId} and l.mission_id = ${missionId}
    order by l.created_at`).map((row) => ({
		taskId: row.task_id,
		objective: row.objective,
		state: row.state,
		projectName: row.project_name
	}));
}
var OutboxRefusal = class extends Error {
	errorClass = "refused";
};
function retryDelaySeconds(attempt) {
	if (!Number.isInteger(attempt) || attempt < 1) return 2;
	return Math.min(60, 2 ** Math.min(attempt, 6));
}
function failureStatus(attempt, maxAttempts, refused) {
	if (refused || attempt >= maxAttempts) return "dead";
	return "failed";
}
function eventId() {
	return `obx_${randomBytes(9).toString("hex")}`;
}
function readPayload(value) {
	if (typeof value === "string") try {
		return JSON.parse(value);
	} catch {
		return {};
	}
	if (value && typeof value === "object") return value;
	return {};
}
async function enqueueOutbox(sql, input) {
	if (!input.idempotencyKey || !input.eventType) throw new OutboxRefusal("An outbox event needs a type and an idempotency key.");
	const payload = {
		effect: "record",
		summary: input.summary.slice(0, 500)
	};
	await sql`insert into outbox_events (
    id, organization_id, event_type, schema_version, correlation_id, causation_id, idempotency_key,
    aggregate_type, aggregate_id, payload, actor_id, status
  ) values (
    ${eventId()}, ${input.orgId}, ${input.eventType}, ${1}, ${input.correlationId}, ${input.causationId}, ${input.idempotencyKey},
    ${input.aggregateType}, ${input.aggregateId}, ${JSON.stringify(payload)}::jsonb, ${input.actorId}, ${"pending"}
  ) on conflict (organization_id, idempotency_key) do nothing`;
}
async function claimOutbox(sql, orgId, fence) {
	return (await sql`update outbox_events set
      status = ${"processing"}, attempt = attempt + 1, lease_fence = ${fence},
      leased_until = now() + interval '30 seconds', updated_at = now()
    where id = (
      select e.id from outbox_events e
      where e.organization_id = ${orgId}
        and e.status in ('pending', 'failed')
        and e.available_at <= now()
        and not exists (
          select 1 from outbox_events earlier
          where earlier.organization_id = e.organization_id
            and earlier.aggregate_id = e.aggregate_id
            and earlier.id <> e.id
            and (earlier.created_at < e.created_at or (earlier.created_at = e.created_at and earlier.id < e.id))
            and earlier.status in ('pending', 'processing', 'failed')
        )
      order by e.created_at asc
      for update skip locked
      limit 1
    ) and status in ('pending', 'failed')
    returning id, organization_id, event_type, aggregate_id, schema_version, payload, attempt, max_attempts, lease_fence`)[0] ?? null;
}
async function applyOutbox(sql, event) {
	const payload = readPayload(event.payload);
	if (Number(event.schema_version) !== 1 || payload.effect !== "record") throw new OutboxRefusal("This event schema is not supported, or it would change authority. It was not applied.");
	await sql`insert into outbox_deliveries (event_id, organization_id, effect)
    values (${event.id}, ${event.organization_id}, ${"recorded"})
    on conflict (event_id) do nothing`;
}
async function completeOutbox(sql, eventId, fence) {
	const rows = await sql`update outbox_events set
      status = ${"completed"}, completed_at = now(), lease_fence = ${""}, last_error = ${""}, error_class = ${""}, updated_at = now()
    where id = ${eventId} and lease_fence = ${fence} and status = ${"processing"} and leased_until > now()
    returning id`;
	return Boolean(rows[0]);
}
async function failOutbox(sql, event, fence, error) {
	const refused = error instanceof OutboxRefusal;
	const attempt = Number(event.attempt) || 1;
	await sql`update outbox_events set
      status = ${failureStatus(attempt, Number(event.max_attempts) || 5, refused)},
      lease_fence = ${""},
      last_error = ${error instanceof Error ? error.message.slice(0, 500) : "The event failed."},
      error_class = ${refused ? "refused" : "failed"},
      available_at = now() + (${retryDelaySeconds(attempt)} * interval '1 second'),
      updated_at = now()
    where id = ${event.id} and lease_fence = ${fence} and status = ${"processing"}`;
}
async function recoverExpiredOutbox(sql, orgId) {
	return (await sql`update outbox_events set
      status = case when attempt >= max_attempts then ${"dead"} else ${"failed"} end,
      lease_fence = ${""},
      last_error = ${"The processing lease expired before the delivery was recorded."},
      error_class = ${"expired"},
      available_at = now(),
      updated_at = now()
    where organization_id = ${orgId} and status = ${"processing"} and leased_until < now()
    returning id`).length;
}
async function processOutbox(sql, orgId, limit = 20) {
	let completed = 0;
	for (let index = 0; index < limit; index += 1) {
		const fence = eventId();
		const claimed = await claimOutbox(sql, orgId, fence);
		if (!claimed) break;
		try {
			if (!await atomically(sql, async (tx) => {
				await applyOutbox(tx, claimed);
				return completeOutbox(tx, claimed.id, fence);
			})) throw new Error("The processing fence no longer owns this event.");
			completed += 1;
		} catch (error) {
			await failOutbox(sql, claimed, fence, error);
		}
	}
	return completed;
}
async function outboxSnapshot(sql, orgId) {
	const rows = await sql`select status, count(*)::int as count,
      extract(epoch from (now() - min(created_at))) as oldest
    from outbox_events where organization_id = ${orgId}
    group by status`;
	const count = (status) => Number(rows.find((row) => row.status === status)?.count ?? 0);
	const oldest = rows.filter((row) => row.status === "pending" || row.status === "processing" || row.status === "failed").reduce((min, row) => {
		const value = Number(row.oldest);
		return Number.isFinite(value) ? Math.min(min, value) : min;
	}, Number.POSITIVE_INFINITY);
	return {
		pending: count("pending"),
		processing: count("processing"),
		failed: count("failed"),
		dead: count("dead"),
		completed: count("completed"),
		oldestSeconds: oldest === Number.POSITIVE_INFINITY ? null : Math.max(0, Math.round(oldest))
	};
}
var company_store_exports = /* @__PURE__ */ __exportAll$1({
	acceptMission: () => acceptMission,
	acceptSpecification: () => acceptSpecification,
	addCompanyContact: () => addCompanyContact,
	answerMission: () => answerMission,
	archiveCompanyParty: () => archiveCompanyParty,
	assignCompanyRole: () => assignCompanyRole,
	authorizeMission: () => authorizeMission,
	authorizeRevalidation: () => authorizeRevalidation,
	cancelMission: () => cancelMission,
	commandCenter: () => commandCenter,
	commandDevice: () => commandDevice,
	commitCharge: () => commitCharge,
	connectGithub: () => connectGithub,
	createCompanyOffer: () => createCompanyOffer,
	createCompanyParty: () => createCompanyParty,
	deactivateCompanyRole: () => deactivateCompanyRole,
	drainOutbox: () => drainOutbox,
	editCompanyOffer: () => editCompanyOffer,
	editCompanyParty: () => editCompanyParty,
	governance: () => governance,
	knowledge: () => knowledge,
	linkMissionProject: () => linkMissionProject,
	linkMissionTask: () => linkMissionTask,
	missionView: () => missionView,
	operations: () => operations,
	payments: () => payments,
	planMission: () => planMission,
	proposeSpecification: () => proposeSpecification,
	reactivateCompanyRole: () => reactivateCompanyRole,
	readDisclosure: () => readDisclosure,
	readGithubForDepartment: () => readGithubForDepartment,
	recordExpenditure: () => recordExpenditure,
	recordObservation: () => recordObservation,
	recordPayment: () => recordPayment,
	recordPrice: () => recordPrice,
	recoverRun: () => recoverRun,
	refreshGithub: () => refreshGithub,
	refreshOperate: () => refreshOperate,
	registerDevice: () => registerDevice,
	registerIntegration: () => registerIntegration,
	rejectMission: () => rejectMission,
	reopenMission: () => reopenMission,
	requestExternalAction: () => requestExternalAction,
	requireOwnerScope: () => requireOwnerScope,
	reserveFunds: () => reserveFunds,
	retireCompanyOffer: () => retireCompanyOffer,
	revokeGithub: () => revokeGithub,
	rework: () => rework,
	runNext: () => runNext,
	setCapacity: () => setCapacity,
	setClassification: () => setClassification,
	setCostPolicy: () => setCostPolicy,
	setDepartmentBudget: () => setDepartmentBudget,
	setDependency: () => setDependency,
	setDisclosure: () => setDisclosure,
	setMilestone: () => setMilestone,
	setMissionBudget: () => setMissionBudget,
	setParent: () => setParent,
	setPriority: () => setPriority,
	setScheduler: () => setScheduler,
	setSpendingCeiling: () => setSpendingCeiling,
	submitMission: () => submitMission,
	syncFindings: () => syncFindings,
	unlinkMissionTask: () => unlinkMissionTask,
	voidPayment: () => voidPayment,
	workforce: () => workforce
});
var noopThink = async () => ({
	text: "",
	model: ""
});
async function commandCenter(sql, userId) {
	const ws = await ensureCompany(sql, userId);
	const missions = await listMissions(sql, ws.orgId);
	const departments = await sql`
    select d.slug, d.name, d.mandate,
      (select count(*)::int from assignments a
        where a.organization_id = d.organization_id and a.department_slug = d.slug
          and a.status in ('READY', 'RUNNING', 'FAILED')) as open
    from departments d where d.organization_id = ${ws.orgId} order by d.name`;
	const awaiting = missions.filter((mission) => mission.status === "AWAITING_ACCEPTANCE");
	const defectRows = await sql`select count(*)::int as open from defects
    where organization_id = ${ws.orgId} and status = ${"open"}`;
	const paid = await sql`select coalesce(sum(amount_cents), 0)::int as total from payments
    where organization_id = ${ws.orgId} and voided_at is null and direction = ${"receipt"}`;
	await expireLeases(sql);
	const workerRows = await sql`
    select status, count(*)::int as count from execution_jobs
    where organization_id = ${ws.orgId} and status in ('leased', 'retry', 'dead')
    group by status`;
	const workers = {
		leased: 0,
		retry: 0,
		dead: 0
	};
	for (const row of workerRows) if (row.status === "leased" || row.status === "retry" || row.status === "dead") workers[row.status] = num(row.count);
	const recent = await sql`
    select id, action, detail, target, created_at from audit_events
    where organization_id = ${ws.orgId} order by created_at desc limit 6`;
	return {
		organization: {
			id: ws.orgId,
			name: ws.orgName,
			role: ws.role
		},
		counts: {
			missions: missions.length,
			executing: missions.filter((mission) => mission.status === "EXECUTING" || mission.status === "AUTHORIZED").length,
			awaiting: awaiting.length,
			defects: num(defectRows[0]?.open),
			recordedCents: num(paid[0]?.total)
		},
		missions,
		departments: departments.map((row) => ({
			slug: row.slug,
			name: row.name,
			mandate: row.mandate,
			open: num(row.open)
		})).sort((a, b) => departmentRank(a.slug) - departmentRank(b.slug)),
		awaiting: awaiting.map((mission) => ({
			id: mission.id,
			title: mission.title
		})),
		recent: recent.map((row) => ({
			id: row.id,
			action: row.action,
			detail: row.detail,
			target: row.target,
			createdAt: iso(row.created_at)
		})),
		disclosure: await readDisclosure(sql, ws.orgId),
		workers,
		scheduler: await readScheduler(sql, ws.orgId),
		findings: (await drainOutbox(sql, ws.orgId, userId), await refreshOperate(sql, ws.orgId, userId), await syncFindings(sql, ws.orgId)),
		resources: await resourceSnapshot(sql, ws.orgId),
		handoffs: await recentHandoffs(sql, ws.orgId),
		changes: await recentChanges(sql, ws.orgId),
		finance: await financeSnapshot(sql, ws.orgId),
		business: await ventureSummary(sql, ws.orgId),
		providers: await providerSnapshot(sql, ws.orgId),
		world: await worldSnapshot(sql, ws.orgId)
	};
}
async function missionView(sql, userId, missionId) {
	const ws = await ensureCompany(sql, userId);
	const mission = await mustMission(sql, ws.orgId, missionId);
	await releaseStaleRuns(sql, ws, mission.id);
	let assignments = await loadAssignments(sql, mission.id);
	try {
		await offerIfReady(sql, ws, mission, assignments);
		assignments = await loadAssignments(sql, mission.id);
	} catch (error) {
		if (!(error instanceof CompanyError)) throw error;
	}
	const audit = await sql`select id, action, detail, from_state, to_state, created_at from audit_events
    where organization_id = ${ws.orgId} and target = ${mission.id}
    order by created_at desc limit 12`;
	return {
		mission: {
			id: mission.id,
			title: mission.title,
			objective: mission.objective,
			status: mission.status,
			strategy: mission.strategy,
			questions: readStrings(mission.questions),
			answers: mission.answers,
			planSource: mission.plan_source,
			dependsOn: mission.depends_on,
			parentId: mission.parent_id,
			priority: mission.priority,
			milestone: mission.milestone,
			classification: mission.classification === "confidential" ? "confidential" : "internal",
			updatedAt: iso(mission.updated_at)
		},
		assignments: assignments.map(toAssignment),
		audit: audit.map((row) => ({
			id: row.id,
			action: row.action,
			detail: row.detail,
			fromState: row.from_state,
			toState: row.to_state,
			createdAt: iso(row.created_at)
		})),
		memory: await memoryTitles(sql, ws.orgId, mission.id),
		defects: await openDefects(sql, mission.id),
		payments: await missionPayments(sql, ws.orgId, mission.id),
		jobs: await missionJobs(sql, mission.id),
		qa: await latestQa(sql, ws.orgId, mission.id, extractHtml(assignments.find((row) => row.agent_slug === "developer")?.artifact ?? "")),
		peers: await peerMissions(sql, ws.orgId, mission.id),
		findings: (await syncFindings(sql, ws.orgId)).filter((item) => item.missionId === mission.id || item.missionId === null),
		handoffs: await missionHandoffs(sql, mission.id),
		taskLinks: await missionTaskLinks(sql, ws.orgId, mission.id)
	};
}
async function workforce(sql, userId) {
	const ws = await ensureCompany(sql, userId);
	const departments = await sql`
    select id, slug, name, mandate from departments where organization_id = ${ws.orgId} order by name`;
	const agents = await sql`select department_id, slug, name, title, responsibility, reports_to, permission_level
    from agents where organization_id = ${ws.orgId} order by name`;
	return { departments: departments.map((department) => ({
		slug: department.slug,
		name: department.name,
		mandate: department.mandate,
		agents: agents.filter((agent) => agent.department_id === department.id).map((agent) => ({
			slug: agent.slug,
			name: agent.name,
			title: agent.title,
			responsibility: agent.responsibility,
			reportsTo: agent.reports_to ? agentBySlug(agent.reports_to)?.name ?? agent.reports_to : null,
			level: Number(agent.permission_level)
		}))
	})).sort((a, b) => departmentRank(a.slug) - departmentRank(b.slug)) };
}
async function drainOutbox(sql, orgId, actorId) {
	const recovered = await recoverExpiredOutbox(sql, orgId);
	await processOutbox(sql, orgId, 20);
	if (recovered < 1) return;
	await sql`insert into audit_events (
    id, organization_id, project_id, task_id, actor_id, actor_kind, action, target, from_state, to_state, detail
  ) values (
    ${nid("aud")}, ${orgId}, ${null}, ${null}, ${actorId}, ${actorId.startsWith("svc:") ? "service" : "human"}, ${"outbox.recovered"}, ${"outbox"},
    ${"processing"}, ${"failed"}, ${`${recovered} expired delivery lease${recovered === 1 ? "" : "s"} returned to the queue. No mission was authorized.`}
  )`;
}
async function refreshOperate(sql, orgId, actorId) {
	const released = await expireLeases(sql);
	const jobs = await sql`select
      count(*) filter (where status = ${"done"})::int as done,
      count(*) filter (where status in ('done', 'dead'))::int as finished,
      count(*) filter (where attempt >= 2)::int as retried
    from execution_jobs where organization_id = ${orgId}`;
	const qa = await sql`select
      count(*) filter (where status = ${"passed"})::int as passed,
      count(*) filter (where status = ${"failed"})::int as failed,
      count(*)::int as total
    from qa_reports where organization_id = ${orgId}`;
	const durations = await sql`select extract(epoch from (updated_at - created_at)) as seconds
    from missions where organization_id = ${orgId} and status = ${"ACCEPTED"}`;
	const blocked = await sql`select count(*)::int as count from missions m
    where m.organization_id = ${orgId} and m.status in ('AUTHORIZED', 'EXECUTING') and m.depends_on is not null
      and not exists (select 1 from missions parent where parent.id = m.depends_on and parent.organization_id = m.organization_id and parent.status = ${"ACCEPTED"})`;
	const defects = await sql`select count(*)::int as count from defects where organization_id = ${orgId} and status = ${"open"}`;
	const prices = await sql`select count(*)::int as count from provider_prices where organization_id = ${orgId} and status = ${"verified"} and review_at <= now()`;
	const github = await sql`select status, last_sync_at, poll_minutes from github_connections
    where organization_id = ${orgId} order by updated_at desc limit 1`;
	const execution = measuredRate(num(jobs[0]?.done), num(jobs[0]?.finished));
	const quality = measuredRate(num(qa[0]?.passed), num(qa[0]?.total));
	const duration = measuredDuration(durations.map((row) => Number(row.seconds)));
	const metrics = [
		{
			name: "Execution success",
			kind: execution.kind,
			sample: execution.sample,
			value: execution.bps == null ? null : Math.round(execution.bps / 100),
			unit: "percent",
			note: execution.note
		},
		{
			name: "Quality pass",
			kind: quality.kind,
			sample: quality.sample,
			value: quality.bps == null ? null : Math.round(quality.bps / 100),
			unit: "percent",
			note: quality.note
		},
		{
			name: "Accepted mission duration",
			kind: duration.kind,
			sample: duration.sample,
			value: duration.seconds,
			unit: "seconds",
			note: duration.note
		},
		{
			name: "Open defects",
			kind: "measured",
			sample: num(defects[0]?.count),
			value: num(defects[0]?.count),
			unit: "count",
			note: "Open defects on record. Zero is a count, not a claim that the work is correct."
		},
		{
			name: "Retries at two or more",
			kind: "measured",
			sample: num(jobs[0]?.retried),
			value: num(jobs[0]?.retried),
			unit: "count",
			note: "Execution jobs whose stored attempt is two or more."
		}
	];
	for (const metric of metrics) await sql`insert into metric_snapshots (id, organization_id, name, sample, value, kind, unit, note)
      values (${nid("met")}, ${orgId}, ${metric.name}, ${metric.sample}, ${metric.value}, ${metric.kind}, ${metric.unit}, ${metric.note})
      on conflict (organization_id, name) do update set sample = ${metric.sample}, value = ${metric.value}, kind = ${metric.kind}, unit = ${metric.unit}, note = ${metric.note}, created_at = now()`;
	const health = githubHealth({
		status: github[0]?.status ?? "",
		lastSyncMs: github[0]?.last_sync_at ? Date.parse(iso(github[0].last_sync_at)) : null,
		pollMinutes: num(github[0]?.poll_minutes) || 60,
		nowMs: Date.now()
	});
	const proposals = [];
	if (released > 0) proposals.push({
		key: "lease:expired",
		kind: "release_expired_lease",
		title: "Expired leases were released",
		evidence: `${released} expired lease${released === 1 ? "" : "s"} moved back to ready.`,
		apply: true
	});
	if (num(prices[0]?.count) > 0) proposals.push({
		key: "price:review",
		kind: "finance",
		title: "A verified price is past its review date",
		evidence: `${num(prices[0]?.count)} price row${num(prices[0]?.count) === 1 ? "" : "s"} passed the recorded review date. Those prices are not used, and none were invented.`,
		apply: false
	});
	if (github[0] && !health.connected) proposals.push({
		key: "github:offline",
		kind: "credential",
		title: "GitHub is not connected",
		evidence: health.note,
		apply: false
	});
	if (health.stale) proposals.push({
		key: "github:stale",
		kind: "diagnostic",
		title: "GitHub sync is stale",
		evidence: health.note,
		apply: false
	});
	const chain = await sql`select r.mission_id, r.specification_id, r.requirement_key, m.status as mission_status,
      l.assignment_id, l.assignment_status, l.execution_id, l.artifact_sha256, q.id as qa_id, q.status as qa_status, q.artifact_sha256 as qa_sha
    from requirements r
    join specifications s on s.id = r.specification_id and s.state = ${"accepted"}
    join missions m on m.id = r.mission_id and m.organization_id = r.organization_id
    left join lateral (
      select link.assignment_id, link.execution_id, link.artifact_sha256, a.status as assignment_status
      from requirement_links link
      left join assignments a on a.id = link.assignment_id
      where link.requirement_key = r.requirement_key and link.specification_id = r.specification_id
      order by link.created_at desc limit 1
    ) l on true
    left join lateral (
      select id, status, artifact_sha256 from qa_reports
      where mission_id = r.mission_id and assignment_id = l.assignment_id
      order by created_at desc limit 1
    ) q on true
    where r.organization_id = ${orgId} and r.change <> ${"removed"}
    limit 200`;
	let uncovered = 0;
	for (const row of chain) {
		const verdict = requirementVerdict({
			agentDone: row.assignment_status === "DONE",
			artifactSha: row.artifact_sha256 ?? "",
			qaStatus: row.qa_status === "passed" || row.qa_status === "failed" ? row.qa_status : "missing",
			qaSha: row.qa_sha ?? "",
			accepted: row.mission_status === "ACCEPTED"
		});
		if (!verdict.complete) uncovered += 1;
		await sql`insert into trace_links (
      id, organization_id, mission_id, specification_id, requirement_key, assignment_id, execution_id, artifact_sha256,
      qa_report_id, qa_passed, accepted, complete, reason
    ) values (
      ${nid("trc")}, ${orgId}, ${row.mission_id}, ${row.specification_id}, ${row.requirement_key}, ${row.assignment_id},
      ${row.execution_id ?? ""}, ${row.artifact_sha256 ?? ""}, ${row.qa_id}, ${row.qa_status === "passed"}, ${row.mission_status === "ACCEPTED"},
      ${verdict.complete}, ${verdict.reason}
    ) on conflict (organization_id, mission_id, requirement_key, specification_id) do update set
      assignment_id = ${row.assignment_id}, execution_id = ${row.execution_id ?? ""}, artifact_sha256 = ${row.artifact_sha256 ?? ""},
      qa_report_id = ${row.qa_id}, qa_passed = ${row.qa_status === "passed"}, accepted = ${row.mission_status === "ACCEPTED"},
      complete = ${verdict.complete}, reason = ${verdict.reason}, updated_at = now()`;
	}
	if (uncovered > 0) proposals.push({
		key: "trace:open",
		kind: "diagnostic",
		title: "Requirements are not fully traced",
		evidence: `${uncovered} accepted-specification requirement${uncovered === 1 ? "" : "s"} lack a matching quality report and owner acceptance. Unaffected deliverables were not reopened.`,
		apply: false
	});
	const prior = await sql`select action_key, status from maintenance_actions where organization_id = ${orgId}`;
	const priorStatus = new Map(prior.map((row) => [row.action_key, row.status]));
	const seen = /* @__PURE__ */ new Set();
	const maintenance = [];
	for (const proposal of proposals) {
		seen.add(proposal.key);
		const decision = maintenanceClass(proposal.apply ? proposal.kind : proposal.kind);
		const autonomous = proposal.apply && decision.autonomous;
		if (proposal.apply && !decision.autonomous) continue;
		const status = autonomous ? "applied" : "proposed";
		const result = autonomous ? proposal.evidence : "Recorded for the owner. No budget, credential, or accepted outcome was changed.";
		await sql`insert into maintenance_actions (
      id, organization_id, action_key, kind, risk, autonomous, status, title, evidence, result
    ) values (
      ${nid("mnt")}, ${orgId}, ${proposal.key}, ${proposal.kind}, ${decision.risk}, ${decision.autonomous}, ${status}, ${proposal.title}, ${proposal.evidence}, ${result}
    ) on conflict (organization_id, action_key) do update set
      risk = ${decision.risk}, autonomous = ${decision.autonomous}, status = ${status}, title = ${proposal.title}, evidence = ${proposal.evidence}, result = ${result}, updated_at = now()`;
		if (priorStatus.get(proposal.key) !== status) await sql`insert into audit_events (
        id, organization_id, project_id, task_id, actor_id, actor_kind, action, target, from_state, to_state, detail
      ) values (
        ${nid("aud")}, ${orgId}, ${null}, ${null}, ${actorId}, ${actorId.startsWith("svc:") ? "service" : "human"}, ${"maintenance." + status}, ${proposal.key},
        ${priorStatus.get(proposal.key) ?? null}, ${status}, ${proposal.evidence.slice(0, 500)}
      )`;
		maintenance.push({
			id: proposal.key,
			title: proposal.title,
			evidence: proposal.evidence,
			risk: decision.risk,
			autonomous: decision.autonomous,
			status,
			result
		});
	}
	for (const row of prior) if (row.status === "proposed" && !seen.has(row.action_key)) await sql`update maintenance_actions set status = ${"cleared"}, result = ${"The condition is no longer present."}, updated_at = now()
        where organization_id = ${orgId} and action_key = ${row.action_key} and status = ${"proposed"}`;
	return {
		metrics,
		maintenance,
		recommendations: recommend({
			qaFailBps: quality.bps == null ? null : Math.round(num(qa[0]?.failed) / Math.max(1, num(qa[0]?.total)) * 1e4),
			retries: num(jobs[0]?.retried),
			blocked: num(blocked[0]?.count)
		}).map((note) => note.text)
	};
}
async function linkMissionProject(sql, userId, missionId, projectId) {
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	const mission = await mustMission(sql, ws.orgId, missionId);
	if (!(await sql`select id from projects where id = ${projectId} and organization_id = ${ws.orgId} limit 1`)[0]) throw new CompanyError("That project is not in this company. The mission was not changed.");
	await refreshOperate(sql, ws.orgId, userId);
	if (!(await sql`update trace_links set project_id = ${projectId}, updated_at = now()
    where organization_id = ${ws.orgId} and mission_id = ${mission.id}
    returning id`)[0]) throw new CompanyError("That mission has no accepted requirement to trace. The project was not linked.");
	await audit(sql, ws, userId, "trace.project", mission.id, null, projectId, "The mission trace now points at an existing project. Tasks were not copied and no work was authorized.");
}
async function linkMissionTask(sql, userId, missionId, taskId) {
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	requireOwner(ws.role);
	const mission = await mustMission(sql, ws.orgId, missionId);
	const status = mission.status;
	const result = await linkTaskToMission(sql, {
		orgId: ws.orgId,
		missionId: mission.id,
		taskId: taskId.trim(),
		actorId: userId,
		linkId: nid("lnk")
	});
	if ((await mustMission(sql, ws.orgId, mission.id)).status !== status) throw new CompanyError("The link changed the mission. It was not kept.");
	if (result === "created") await audit(sql, ws, userId, "mission.task_linked", mission.id, null, taskId.trim(), "The owner linked an existing task. The task was not started and the mission was not authorized.");
}
async function unlinkMissionTask(sql, userId, missionId, taskId) {
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	requireOwner(ws.role);
	const mission = await mustMission(sql, ws.orgId, missionId);
	await unlinkTaskFromMission(sql, {
		orgId: ws.orgId,
		missionId: mission.id,
		taskId: taskId.trim(),
		actorId: userId
	});
	await mustMission(sql, ws.orgId, mission.id);
	await audit(sql, ws, userId, "mission.task_unlinked", mission.id, taskId.trim(), null, "The owner removed the link. The task and the mission still exist.");
}
async function operations(sql, userId) {
	const ws = await ensureCompany(sql, userId);
	await drainOutbox(sql, ws.orgId, userId);
	await expireLeases(sql);
	const rows = await sql`select a.id, a.mission_id, m.title as mission_title, a.agent_slug, a.title, a.status, a.updated_at
    from assignments a join missions m on m.id = a.mission_id
    where a.organization_id = ${ws.orgId}
    order by a.updated_at desc limit 40`;
	const recoveries = await sql`
    select id, detail, created_at from audit_events
    where organization_id = ${ws.orgId} and action = ${"assignment.recovered"}
    order by created_at desc limit 6`;
	const leases = await sql`
    select m.id as mission_id, m.title as mission_title, a.agent_slug, j.leased_until
    from execution_jobs j
    join assignments a on a.id = j.assignment_id
    join missions m on m.id = j.mission_id
    where j.organization_id = ${ws.orgId} and j.status = ${"leased"}
    order by j.leased_until asc limit 8`;
	const sandboxRows = await sql`
    select suite, sandbox from qa_reports
    where organization_id = ${ws.orgId}
    order by created_at desc limit 1`;
	const operate = await refreshOperate(sql, ws.orgId, userId);
	return {
		scheduler: await readScheduler(sql, ws.orgId),
		capacity: await readCapacity(sql, ws.orgId),
		workers: await workerCounts(sql, ws.orgId),
		leases: leases.map((row) => ({
			missionId: row.mission_id,
			missionTitle: row.mission_title,
			agentName: agentBySlug(row.agent_slug)?.name ?? row.agent_slug,
			until: iso(row.leased_until)
		})),
		sandbox: readSandbox(sandboxRows[0]?.suite ?? "", sandboxRows[0]?.sandbox),
		recoveries: recoveries.map((row) => ({
			id: row.id,
			detail: row.detail,
			createdAt: iso(row.created_at)
		})),
		rows: rows.map((row) => ({
			id: row.id,
			missionId: row.mission_id,
			missionTitle: row.mission_title,
			agentName: agentBySlug(row.agent_slug)?.name ?? row.agent_slug,
			title: row.title,
			status: row.status,
			updatedAt: iso(row.updated_at)
		})),
		metrics: operate.metrics,
		maintenance: operate.maintenance,
		recommendations: operate.recommendations,
		outbox: await outboxSnapshot(sql, ws.orgId),
		rateLimit: commandRateSnapshot()
	};
}
async function knowledge(sql, userId) {
	return { entries: (await sql`select id, kind, title, body, source, verified, state, version, confidence, mission_id, created_at
    from knowledge_entries where organization_id = ${(await ensureCompany(sql, userId)).orgId}
    order by created_at desc limit 40`).map((row) => ({
		id: row.id,
		kind: row.kind,
		title: row.title,
		body: row.body,
		source: row.source,
		verified: Boolean(row.verified),
		state: row.state || (row.verified ? "accepted" : "proposed"),
		version: num(row.version) || 1,
		confidence: row.confidence || "stated",
		missionId: row.mission_id,
		createdAt: iso(row.created_at)
	})) };
}
async function governance(sql, userId) {
	const ws = await ensureCompany(sql, userId);
	return {
		events: (await sql`select id, action, actor_id, detail, target, from_state, to_state, created_at
    from audit_events where organization_id = ${ws.orgId}
    order by created_at desc limit 40`).map((row) => ({
			id: row.id,
			action: row.action,
			actorId: row.actor_id,
			detail: row.detail,
			target: row.target,
			fromState: row.from_state,
			toState: row.to_state,
			createdAt: iso(row.created_at)
		})),
		disclosure: await readDisclosure(sql, ws.orgId),
		workers: await workerCounts(sql, ws.orgId),
		scheduler: await readScheduler(sql, ws.orgId)
	};
}
async function submitMission(sql, userId, objective) {
	const clean = objective.trim().replace(/\s+/g, " ");
	if (clean.length < 8) throw new CompanyError("Describe the objective in at least a short sentence.");
	if (clean.length > 2e3) throw new CompanyError("Keep the objective under 2000 characters.");
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	const id = nid("msn");
	const title = titleFrom(clean);
	await sql`insert into missions (
    id, organization_id, title, objective, status, created_by
  ) values (${id}, ${ws.orgId}, ${title}, ${clean}, ${"PROPOSED"}, ${userId})`;
	await audit(sql, ws, userId, "mission.proposed", id, null, "PROPOSED", clean);
	return { missionId: id };
}
async function planMission(sql, userId, missionId, think = noopThink) {
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	const mission = await mustMission(sql, ws.orgId, missionId);
	if (mission.status !== "PROPOSED" && mission.status !== "PLANNED" && mission.status !== "REJECTED") throw new CompanyError("This mission can only be planned before it is authorized.");
	const existing = await loadAssignments(sql, mission.id);
	if (existing.some((row) => row.status === "RUNNING")) throw new CompanyError("Recover the running department before rewriting the plan.");
	if (mission.status !== "REJECTED" && existing.some((row) => row.status === "DONE")) throw new CompanyError("Work has already started. Reject the packet, or cancel the mission, before a new plan.");
	const memory = await memoryBrief(sql, ws.orgId, mission.id);
	await noteReuse(sql, ws.orgId, mission.id, memory.ids);
	const thought = await gatedThink(sql, ws.orgId, think, {
		system: "You are the CEO of Atomic Dream Labs inside NEXUS. You write a plan. You do not execute it and you cannot accept it. Return JSON only. Do not contradict verified memory.",
		user: `Objective:\n${mission.objective}\n\nOwner's answer, if any:\n${mission.answers.trim() || "None yet."}\n\nVerified memory from accepted missions:\n${memory.text || "None yet."}\n\nReturn JSON with keys title (string), strategy (markdown), questions (array of at most 2 strings; empty if the objective is specific), assignments (array of {agent, title, brief}). Agents must be chosen from: researcher, product, architect, designer, developer, qa, coo. Briefs are one or two sentences. Do not claim the mission is finished.`
	}, mission.classification === "confidential" ? "confidential" : "internal");
	const plan = thought.text.trim() ? planFromModel(mission.objective, thought.text) : localPlan(mission.objective);
	const source = thought.text.trim() ? plan.source : thought.unavailable ? "local-orchestrator · model unavailable" : plan.source;
	const strategy = mission.answers.trim() ? `${plan.strategy}\n\n## Owner\n${mission.answers.trim()}` : plan.strategy;
	if (mission.status === "REJECTED") assertMissionTransition("REJECTED", "PLANNED");
	else if (mission.status === "PROPOSED") assertMissionTransition("PROPOSED", "PLANNED");
	if (!await atomically(sql, async (tx) => {
		if (!(await tx`update missions set
      title = ${plan.title}, strategy = ${strategy}, questions = ${JSON.stringify(plan.questions)}::jsonb,
      plan_source = ${source}, status = ${"PLANNED"}, updated_at = now()
    where id = ${mission.id} and organization_id = ${ws.orgId} and status = ${mission.status}
    returning id`)[0]) return false;
		await tx`delete from assignments where mission_id = ${mission.id} and organization_id = ${ws.orgId}`;
		for (const [index, slot] of plan.assignments.entries()) {
			const agent = agentBySlug(slot.agent);
			await tx`insert into assignments (
        id, mission_id, organization_id, agent_slug, department_slug, title, brief, position, status
      ) values (
        ${nid("asg")}, ${mission.id}, ${ws.orgId}, ${slot.agent}, ${agent?.department ?? "executive"},
        ${slot.title}, ${slot.brief}, ${index}, ${"QUEUED"}
      )`;
		}
		await tx`delete from knowledge_entries
      where organization_id = ${ws.orgId} and mission_id = ${mission.id}
        and verified = ${false} and kind = ${"decision"} and title like ${"Strategy · %"}`;
		await remember(tx, ws.orgId, mission.id, "decision", `Strategy · ${plan.title}`, strategy, "ceo", false);
		await audit(tx, ws, userId, "mission.planned", mission.id, mission.status, "PLANNED", memory.text ? `${source} · used verified memory` : source);
		await enqueueOutbox(tx, {
			orgId: ws.orgId,
			eventType: "assignment.recorded",
			idempotencyKey: `assignment.recorded:${mission.id}:${sha256(plan.assignments.map((slot) => slot.title).join("\n"))}`,
			correlationId: mission.id,
			causationId: userId,
			aggregateType: "mission",
			aggregateId: mission.id,
			actorId: userId,
			summary: `${plan.assignments.length} departments were recorded. None were authorized by this event.`
		});
		return true;
	})) throw new CompanyError("The mission changed before the plan could be saved.");
	await drainOutbox(sql, ws.orgId, userId);
}
async function authorizeMission(sql, userId, missionId) {
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	const mission = await mustMission(sql, ws.orgId, missionId);
	assertMissionTransition(mission.status, "AUTHORIZED");
	if ((await loadAssignments(sql, mission.id)).length !== canonicalAssignments(mission.objective).length) throw new CompanyError("The plan is incomplete.");
	if (mission.depends_on) {
		if ((await mustMission(sql, ws.orgId, mission.depends_on)).status !== "ACCEPTED") throw new CompanyError("This mission waits on another mission that is not accepted.");
	}
	await atomically(sql, async (tx) => {
		await moveMission(tx, mission, "AUTHORIZED", ws, userId, "mission.authorized", "Owner authorized the plan");
		await tx`update assignments set status = ${"READY"}, updated_at = now()
      where mission_id = ${mission.id} and position = 0`;
		await enqueueOutbox(tx, {
			orgId: ws.orgId,
			eventType: "mission.authorized",
			idempotencyKey: `mission.authorized:${mission.id}:${nid("rev")}`,
			correlationId: mission.id,
			causationId: userId,
			aggregateType: "mission",
			aggregateId: mission.id,
			actorId: userId,
			summary: "Owner authorized the plan. Delivery does not authorize it again."
		});
	});
	await drainOutbox(sql, ws.orgId, userId);
}
async function runNext(sql, userId, missionId, think = noopThink) {
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	const mission = await mustMission(sql, ws.orgId, missionId);
	if (mission.status !== "AUTHORIZED" && mission.status !== "EXECUTING") throw new CompanyError("Authorize the plan before a department can run.");
	await releaseStaleRuns(sql, ws, mission.id);
	let assignments = await loadAssignments(sql, mission.id);
	if (assignments.some((row) => row.status === "RUNNING")) throw new CompanyError("A department is still marked running. Recover it before starting another.");
	const next = assignments.find((row) => row.status !== "DONE");
	if (!next) {
		await offerIfReady(sql, ws, mission, assignments);
		return {
			agent: "Operations",
			stopped: true
		};
	}
	const prior = assignments.filter((row) => row.position < next.position);
	if (prior.some((row) => row.status !== "DONE")) throw new CompanyError("An earlier department has not finished.");
	const token = nid("run");
	let beat;
	let leaseLost = false;
	try {
		await claimLease(sql, {
			orgId: ws.orgId,
			missionId: mission.id,
			assignmentId: next.id,
			fence: token,
			jobId: nid("job")
		});
		beat = setInterval(() => {
			renewLease(sql, token).then((held) => {
				if (!held) leaseLost = true;
			}, () => {
				leaseLost = true;
			});
		}, 2e4);
		if (mission.status === "AUTHORIZED") await moveMission(sql, mission, "EXECUTING", ws, userId, "mission.executing", next.title);
		const memory = await memoryBrief(sql, ws.orgId, mission.id);
		await noteReuse(sql, ws.orgId, mission.id, memory.ids);
		const defects = (await openDefects(sql, mission.id)).map((item) => `- ${item.name}: ${item.detail}`).join("\n");
		const produced = await produce(sql, ws.orgId, next, mission.objective, mission.strategy, mission.answers, prior, think, memory.text, defects, token, mission.classification === "confidential" ? "confidential" : "internal");
		const failedQa = next.agent_slug === "qa" && !allPassed(produced.evidence);
		const status = failedQa ? "FAILED" : "DONE";
		if (!(!leaseLost && await renewLease(sql, token))) {
			await sql`update execution_jobs set status = ${"expired"}, updated_at = now()
        where fence = ${token} and status = ${"leased"}`;
			await sql`update assignments set status = ${"READY"}, model = ${""}, run_token = ${""},
          error = ${"The lease expired before the run could save."}, updated_at = now()
        where id = ${next.id} and organization_id = ${ws.orgId} and status = ${"RUNNING"} and run_token = ${token}`;
			return {
				agent: agentBySlug(next.agent_slug)?.name ?? next.agent_slug,
				stopped: true
			};
		}
		if (!await commitLease(sql, token, async (tx) => {
			if (!(await tx`update assignments set
          status = ${status}, artifact = ${produced.body}, evidence = ${JSON.stringify(produced.evidence)}::jsonb,
          model = ${produced.model}, run_token = ${""}, error = ${failedQa ? "Verification did not pass." : ""}, updated_at = now()
        where id = ${next.id} and organization_id = ${ws.orgId} and status = ${"RUNNING"} and run_token = ${token}
        returning id`)[0]) return null;
			if (produced.runtime) {
				await tx`insert into qa_reports (
          id, organization_id, mission_id, assignment_id, artifact_sha256, status, report, execution_id, suite, sandbox
        ) values (
          ${nid("qa")}, ${ws.orgId}, ${mission.id}, ${next.id}, ${produced.runtime.sha256},
          ${produced.runtime.passed ? "passed" : "failed"}, ${JSON.stringify(produced.runtime)}::jsonb,
          ${token}, ${produced.runtime.suite}, ${JSON.stringify(produced.runtime.sandbox)}::jsonb
        )`;
				await tx`update revalidations set
          state = ${produced.runtime.passed ? "revalidated" : "in_progress"},
          deliverable_sha256 = ${produced.runtime.sha256},
          qa_execution_id = ${token},
          suite = ${produced.runtime.suite},
          result = ${produced.runtime.passed ? "passed" : "failed"},
          updated_at = now()
          where organization_id = ${ws.orgId} and mission_id = ${mission.id} and state = ${"authorized"}`;
			}
			const disclosure = await readDisclosure(tx, ws.orgId);
			await tx`insert into model_dispatches (
        id, organization_id, mission_id, execution_id, provider, model, classification, disclosure, outcome, duration_ms, error_category
      ) values (
        ${nid("mdl")}, ${ws.orgId}, ${mission.id}, ${token}, ${produced.provider}, ${produced.model},
        ${mission.classification === "confidential" ? "confidential" : "internal"}, ${disclosure},
        ${produced.outcome}, ${produced.durationMs}, ${produced.errorCategory}
      )`;
			const quote = await pricedQuote(tx, ws.orgId, produced.provider, produced.model, null, null, null);
			await tx`insert into cost_records (
        id, organization_id, mission_id, department_slug, execution_id, provider, model, pricing_id, pricing_version, kind, cents, note
      ) values (
        ${nid("cst")}, ${ws.orgId}, ${mission.id}, ${next.department_slug}, ${token}, ${produced.provider}, ${produced.model},
        ${quote.pricingId}, ${quote.pricingVersion}, ${quote.kind}, ${quote.cents}, ${quote.reason}
      )`;
			await audit(tx, ws, "svc:nexus", failedQa ? "assignment.failed" : "assignment.completed", mission.id, "RUNNING", status, `${produced.model} · ${next.agent_slug}: ${next.title}`);
			if (next.agent_slug === "qa") {
				if (failedQa) await recordDefects(tx, ws.orgId, mission.id, produced.evidence);
				else await closeDefects(tx, mission.id);
			}
			if (!failedQa) {
				const following = assignments.find((row) => row.position === next.position + 1);
				if (following && following.status === "QUEUED") {
					await tx`update assignments set status = ${"READY"}, updated_at = now()
            where id = ${following.id} and organization_id = ${ws.orgId} and status = ${"QUEUED"}`;
					const completed = produced.body.replace(/\s+/g, " ").trim().slice(0, 500);
					await tx`insert into handoffs (
            id, organization_id, mission_id, from_department, to_department, from_assignment, to_assignment,
            completed, outstanding, risks, criteria
          ) values (
            ${nid("hand")}, ${ws.orgId}, ${mission.id}, ${next.department_slug}, ${following.department_slug},
            ${next.id}, ${following.id}, ${completed || "No artifact text was stored."},
            ${following.brief.slice(0, 500)}, ${""}, ${following.brief.slice(0, 500)}
          )`;
				}
			}
			await enqueueOutbox(tx, {
				orgId: ws.orgId,
				eventType: "execution.completed",
				idempotencyKey: `execution.completed:${token}`,
				correlationId: mission.id,
				causationId: token,
				aggregateType: "execution",
				aggregateId: token,
				actorId: "svc:nexus",
				summary: `${status} ${next.agent_slug}. The event records the committed run and does not run it again.`
			});
			if (produced.runtime) await enqueueOutbox(tx, {
				orgId: ws.orgId,
				eventType: "qa.recorded",
				idempotencyKey: `qa.recorded:${token}`,
				correlationId: mission.id,
				causationId: token,
				aggregateType: "execution",
				aggregateId: token,
				actorId: "svc:nexus",
				summary: "A quality report was stored with this run. The event does not change its result."
			});
			await enqueueOutbox(tx, {
				orgId: ws.orgId,
				eventType: "artifact.recorded",
				idempotencyKey: `artifact.recorded:${token}`,
				correlationId: mission.id,
				causationId: token,
				aggregateType: "execution",
				aggregateId: token,
				actorId: "svc:nexus",
				summary: "The department artifact was stored. The event does not accept it."
			});
			if (failedQa) await enqueueOutbox(tx, {
				orgId: ws.orgId,
				eventType: "defect.recorded",
				idempotencyKey: `defect.recorded:${token}`,
				correlationId: mission.id,
				causationId: token,
				aggregateType: "mission",
				aggregateId: mission.id,
				actorId: "svc:nexus",
				summary: "Verification defects were stored. The event does not close them."
			});
			return { ok: true };
		})) {
			await sql`update execution_jobs set status = ${"expired"}, updated_at = now()
        where fence = ${token} and status = ${"leased"}`;
			await sql`update assignments set status = ${"READY"}, model = ${""}, run_token = ${""},
          error = ${"The lease expired before the run could save."}, updated_at = now()
        where id = ${next.id} and organization_id = ${ws.orgId} and status = ${"RUNNING"} and run_token = ${token}`;
			return {
				agent: agentBySlug(next.agent_slug)?.name ?? next.agent_slug,
				stopped: true
			};
		}
		await drainOutbox(sql, ws.orgId, userId);
		if (failedQa) return {
			agent: agentBySlug(next.agent_slug)?.name ?? next.agent_slug,
			stopped: true
		};
		if (next.position === assignments.length - 1) {
			assignments = await loadAssignments(sql, mission.id);
			await offerIfReady(sql, ws, mission, assignments);
			return {
				agent: agentBySlug(next.agent_slug)?.name ?? next.agent_slug,
				stopped: true
			};
		}
		return {
			agent: agentBySlug(next.agent_slug)?.name ?? next.agent_slug,
			stopped: false
		};
	} catch (error) {
		await failLease(sql, token, error instanceof Error ? error.message : "The department run failed.");
		throw error;
	} finally {
		if (beat) clearInterval(beat);
	}
}
async function recoverRun(sql, userId, missionId) {
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	const mission = await mustMission(sql, ws.orgId, missionId);
	const running = await sql`select id from assignments
    where mission_id = ${mission.id} and organization_id = ${ws.orgId} and status = ${"RUNNING"}`;
	if (!running[0]) throw new CompanyError("Nothing is stuck in a run.");
	await sql`update execution_jobs set status = ${"cancelled"}, updated_at = now()
    where assignment_id = ${running[0].id} and status = ${"leased"}`;
	await sql`update assignments set status = ${"READY"}, model = ${""}, run_token = ${""}, error = ${"Recovered before an artifact was written."}, updated_at = now()
    where id = ${running[0].id} and status = ${"RUNNING"}`;
	await audit(sql, ws, userId, "assignment.recovered", mission.id, "RUNNING", "READY", "No artifact invented");
}
async function rework(sql, userId, missionId) {
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	const mission = await mustMission(sql, ws.orgId, missionId);
	if (mission.status === "AWAITING_ACCEPTANCE") await moveMission(sql, mission, "EXECUTING", ws, userId, "mission.rework", "Owner sent the packet back");
	else if (mission.status !== "EXECUTING") throw new CompanyError("Only an active mission can be sent back.");
	const assignments = await loadAssignments(sql, mission.id);
	if (assignments.some((row) => row.status === "RUNNING")) throw new CompanyError("Recover the running department before sending work back.");
	const open = await openDefects(sql, mission.id);
	const start = reworkFrom(open.map((item) => item.name), assignments.filter((row) => row.status === "FAILED").map((row) => row.agent_slug));
	const startAt = PIPELINE.indexOf(start);
	await cancelLeases(sql, mission.id);
	for (const agent of PIPELINE) {
		const index = PIPELINE.indexOf(agent);
		if (index < startAt) continue;
		await sql`update assignments set status = ${index === startAt ? "READY" : "QUEUED"}, artifact = ${""}, evidence = ${"[]"}::jsonb, model = ${""}, run_token = ${""}, error = ${""}, updated_at = now()
      where mission_id = ${mission.id} and agent_slug = ${agent}`;
	}
	await audit(sql, ws, userId, "mission.rework", mission.id, mission.status, "EXECUTING", `${agentBySlug(start)?.name ?? start} must redo the failed check`);
	return { agent: agentBySlug(start)?.name ?? start };
}
async function acceptMission(sql, userId, missionId, note) {
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	const mission = await mustMission(sql, ws.orgId, missionId);
	assertMissionTransition(mission.status, "ACCEPTED");
	const assignments = await loadAssignments(sql, mission.id);
	const qa = assignments.find((row) => row.agent_slug === "qa");
	if (!qa || qa.status !== "DONE" || !allPassed(readChecks(qa.evidence))) throw new CompanyError("Acceptance requires a passing verification record.");
	const reports = await sql`select status, artifact_sha256 from qa_reports
    where organization_id = ${ws.orgId} and mission_id = ${mission.id}
    order by created_at desc limit 1`;
	const implementation = assignments.find((row) => row.agent_slug === "developer")?.artifact ?? "";
	const hash = sha256(extractHtml(implementation));
	if (!reports[0] || !evidenceStillCovers(reports[0].artifact_sha256, hash, reports[0].status)) throw new CompanyError("Acceptance needs a passing report for this exact implementation. A later edit does not keep the old pass.");
	if (childBlocksAcceptance((await sql`select status from missions
    where organization_id = ${ws.orgId} and parent_id = ${mission.id}`).map((row) => row.status))) throw new CompanyError("Subordinate missions are still open. Accept or cancel them before accepting this objective.");
	await atomically(sql, async (tx) => {
		await moveMission(tx, mission, "ACCEPTED", ws, userId, "mission.accepted", note.trim() || "Owner accepted the packet");
		const product = assignments.find((row) => row.agent_slug === "product")?.artifact ?? "";
		const clip = (value) => value.replace(/\s+/g, " ").trim().slice(0, 700);
		await remember(tx, ws.orgId, mission.id, "decision", `Accepted · ${mission.title}`, [
			note.trim() || mission.objective,
			"",
			"Specification",
			clip(product) || "No specification on record.",
			"",
			"Implementation",
			clip(implementation) || "No implementation on record."
		].join("\n"), "owner", true);
		await recordAcceptedSpecification(tx, ws.orgId, mission.id, userId, mission.strategy, product);
		await enqueueOutbox(tx, {
			orgId: ws.orgId,
			eventType: "mission.accepted",
			idempotencyKey: `mission.accepted:${mission.id}`,
			correlationId: mission.id,
			causationId: userId,
			aggregateType: "mission",
			aggregateId: mission.id,
			actorId: userId,
			summary: "The owner accepted the packet. Replaying the event does not accept it again."
		});
		await enqueueOutbox(tx, {
			orgId: ws.orgId,
			eventType: "knowledge.promoted",
			idempotencyKey: `knowledge.promoted:${mission.id}`,
			correlationId: mission.id,
			causationId: userId,
			aggregateType: "mission",
			aggregateId: mission.id,
			actorId: userId,
			summary: "Accepted knowledge was stored with the packet. The event does not promote anything else."
		});
	});
	await drainOutbox(sql, ws.orgId, userId);
}
async function rejectMission(sql, userId, missionId, note) {
	const clean = note.trim();
	if (clean.length < 4) throw new CompanyError("Say why it is rejected.");
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	const mission = await mustMission(sql, ws.orgId, missionId);
	assertMissionTransition(mission.status, "REJECTED");
	await moveMission(sql, mission, "REJECTED", ws, userId, "mission.rejected", clean);
}
async function cancelMission(sql, userId, missionId) {
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	const mission = await mustMission(sql, ws.orgId, missionId);
	assertMissionTransition(mission.status, "CANCELLED");
	await cancelLeases(sql, mission.id);
	await sql`update assignments set status = ${"FAILED"}, error = ${"Mission cancelled."}, model = ${""}, run_token = ${""}, updated_at = now()
    where mission_id = ${mission.id} and organization_id = ${ws.orgId} and status <> ${"DONE"}`;
	await moveMission(sql, mission, "CANCELLED", ws, userId, "mission.cancelled", "Owner cancelled the mission");
}
async function reopenMission(sql, userId, missionId) {
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	const mission = await mustMission(sql, ws.orgId, missionId);
	assertMissionTransition(mission.status, "PLANNED");
	await moveMission(sql, mission, "PLANNED", ws, userId, "mission.reopened", "Rejected mission returned to the plan. Departments run again.");
	await cancelLeases(sql, mission.id);
	await sql`update assignments set status = ${"QUEUED"}, artifact = ${""}, evidence = ${"[]"}::jsonb, model = ${""}, run_token = ${""}, error = ${""}, updated_at = now()
    where mission_id = ${mission.id} and organization_id = ${ws.orgId}`;
}
async function answerMission(sql, userId, missionId, note) {
	const clean = note.trim().replace(/\s+/g, " ");
	if (clean.length < 4) throw new CompanyError("Write the answer in a sentence.");
	if (clean.length > 1e3) throw new CompanyError("Keep the answer under 1000 characters.");
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	const mission = await mustMission(sql, ws.orgId, missionId);
	if (mission.status !== "PROPOSED" && mission.status !== "PLANNED" && mission.status !== "REJECTED") throw new CompanyError("Answers belong on the plan, before execution.");
	if (!(await sql`update missions set answers = ${clean}, updated_at = now()
    where id = ${mission.id} and organization_id = ${ws.orgId} and status = ${mission.status}
    returning id`)[0]) throw new CompanyError("The mission changed before the answer could be saved.");
	await audit(sql, ws, userId, "mission.answered", mission.id, mission.status, mission.status, clean);
}
async function setDependency(sql, userId, missionId, dependsOn) {
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	const mission = await mustMission(sql, ws.orgId, missionId);
	if (mission.status !== "PROPOSED" && mission.status !== "PLANNED" && mission.status !== "REJECTED") throw new CompanyError("A dependency can only be set before execution.");
	const target = dependsOn.trim();
	let parentTitle = "none";
	let stored = null;
	if (target) {
		if (target === mission.id) throw new CompanyError("A mission cannot depend on itself.");
		const parent = await mustMission(sql, ws.orgId, target);
		const links = await sql`
      select id, depends_on from missions where organization_id = ${ws.orgId}`;
		const depends = new Map(links.map((row) => [row.id, row.depends_on || null]));
		if (walksIntoCycle(mission.id, parent.id, depends)) throw new CompanyError("That dependency loops back to this mission.");
		stored = parent.id;
		parentTitle = parent.title;
	}
	if (!(await sql`update missions set depends_on = ${stored}, updated_at = now()
    where id = ${mission.id} and organization_id = ${ws.orgId} and status = ${mission.status}
    returning id`)[0]) throw new CompanyError("The mission changed before the dependency could be saved.");
	await audit(sql, ws, userId, "mission.dependency", mission.id, mission.status, mission.status, `Depends on ${parentTitle}`);
}
async function setParent(sql, userId, missionId, parentId) {
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	const mission = await mustMission(sql, ws.orgId, missionId);
	if (mission.status !== "PROPOSED" && mission.status !== "PLANNED" && mission.status !== "REJECTED") throw new CompanyError("A parent can only be set before execution.");
	const target = parentId.trim();
	let stored = null;
	let label = "none";
	if (target) {
		if (target === mission.id) throw new CompanyError("A mission cannot contain itself.");
		const parent = await mustMission(sql, ws.orgId, target);
		const links = await sql`
      select id, parent_id from missions where organization_id = ${ws.orgId}`;
		const parents = new Map(links.map((row) => [row.id, row.parent_id || null]));
		if (walksIntoCycle(mission.id, parent.id, parents)) throw new CompanyError("That parent loops back to this mission.");
		stored = parent.id;
		label = parent.title;
	}
	if (!(await sql`update missions set parent_id = ${stored}, updated_at = now()
    where id = ${mission.id} and organization_id = ${ws.orgId} and status = ${mission.status}
    returning id`)[0]) throw new CompanyError("The mission changed before the parent could be saved.");
	await audit(sql, ws, userId, "mission.parent", mission.id, mission.status, mission.status, `Parent ${label}`);
}
async function setPriority(sql, userId, missionId, raw) {
	const priority = clampPriority(Number(raw));
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	const mission = await mustMission(sql, ws.orgId, missionId);
	if (mission.status === "ACCEPTED" || mission.status === "CANCELLED") throw new CompanyError("Priority is for work that is still open.");
	if (!(await sql`update missions set priority = ${priority}, updated_at = now()
    where id = ${mission.id} and organization_id = ${ws.orgId} and status = ${mission.status}
    returning id`)[0]) throw new CompanyError("The mission changed before the priority could be saved.");
	await audit(sql, ws, userId, "mission.priority", mission.id, mission.status, mission.status, `Priority ${priority}`);
}
async function setMilestone(sql, userId, missionId, note) {
	const milestone = note.trim().slice(0, 160);
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	const mission = await mustMission(sql, ws.orgId, missionId);
	if (!(await sql`update missions set milestone = ${milestone}, updated_at = now()
    where id = ${mission.id} and organization_id = ${ws.orgId}
    returning id`)[0]) throw new CompanyError("The mission changed before the milestone could be saved.");
	await audit(sql, ws, userId, "mission.milestone", mission.id, mission.status, mission.status, milestone || "Milestone cleared");
}
async function setCapacity(sql, userId, raw) {
	const value = Number(raw);
	if (!Number.isInteger(value) || value < 1 || value > 8) throw new CompanyError("Capacity is 1 to 8 departments running at once.");
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	await sql`insert into portfolio_limits (organization_id, max_concurrent)
    values (${ws.orgId}, ${value})
    on conflict (organization_id) do update set max_concurrent = ${value}, updated_at = now()`;
	await audit(sql, ws, userId, "portfolio.capacity", ws.orgId, null, String(value), `Concurrent departments set to ${value}. Spend and permissions are unchanged.`);
}
async function setSpendingCeiling(sql, userId, raw) {
	const cents = dollarsToCents(raw);
	if (cents == null) throw new CompanyError("Enter a ceiling like 100 or 100.00.");
	const ws = await ensureCompany(sql, userId);
	if (!ownerMaySetCeiling(ws.role)) throw new CompanyError("Only the owner can set a spending ceiling.");
	await sql`insert into portfolio_limits (organization_id, max_concurrent, spending_ceiling_cents)
    values (${ws.orgId}, 1, ${cents})
    on conflict (organization_id) do update set spending_ceiling_cents = ${cents}, updated_at = now()`;
	await audit(sql, ws, userId, "finance.ceiling", ws.orgId, null, String(cents), `Spending ceiling set to ${formatMoney(cents)}. Past payments stay on the ledger.`);
}
async function setMissionBudget(sql, userId, missionId, raw) {
	const cents = raw.trim() ? dollarsToCents(raw) : 0;
	if (cents == null) throw new CompanyError("Enter a mission budget like 40 or 40.00.");
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	const mission = await mustMission(sql, ws.orgId, missionId);
	const stored = raw.trim() ? cents : null;
	await sql`update missions set budget_cents = ${stored}, updated_at = now() where id = ${mission.id} and organization_id = ${ws.orgId}`;
	await audit(sql, ws, userId, "finance.mission_budget", mission.id, null, stored == null ? "cleared" : String(stored), stored == null ? "Mission budget cleared." : `Mission budget set to ${formatMoney(stored)}.`);
}
async function setDepartmentBudget(sql, userId, department, raw) {
	const slug = department.trim();
	if (!DEPARTMENTS$1.some((item) => item.slug === slug)) throw new CompanyError("That department is not in this company.");
	const cents = dollarsToCents(raw);
	if (cents == null) throw new CompanyError("Enter a department allocation like 40 or 40.00.");
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	await sql`insert into department_budgets (organization_id, department_slug, amount_cents)
    values (${ws.orgId}, ${slug}, ${cents})
    on conflict (organization_id, department_slug) do update set amount_cents = ${cents}`;
	await audit(sql, ws, userId, "finance.department_budget", ws.orgId, null, String(cents), `${slug} allocation set to ${formatMoney(cents)}.`);
}
async function setCostPolicy(sql, userId, policy) {
	if (policy !== "record_unknown" && policy !== "refuse") throw new CompanyError("The cost policy is record_unknown or refuse.");
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	await sql`insert into cost_policy (organization_id, unknown_cost) values (${ws.orgId}, ${policy})
    on conflict (organization_id) do update set unknown_cost = ${policy}`;
	await audit(sql, ws, userId, "finance.cost_policy", ws.orgId, null, policy, policy === "refuse" ? "External calls without a verified price are now refused." : "External calls may run when the price is unknown. The cost is recorded as unknown, not zero.");
}
async function recordPrice(sql, userId, input) {
	const provider = input.provider.trim();
	const model = input.model.trim();
	if (!provider || !model) throw new CompanyError("Name the provider and the model.");
	const inputRate = rateOrNull(input.inputRate);
	const outputRate = rateOrNull(input.outputRate);
	if (input.inputRate.trim() && inputRate == null) throw new CompanyError("Input price must be a whole number of cents per million tokens, or blank if unknown.");
	if (input.outputRate.trim() && outputRate == null) throw new CompanyError("Output price must be a whole number of cents per million tokens, or blank if unknown.");
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	const prior = await sql`select coalesce(max(version), 0)::int as version from provider_prices
    where organization_id = ${ws.orgId} and provider = ${provider} and model = ${model}`;
	await sql`insert into provider_prices (
    id, organization_id, provider, model, version, input_cents_per_million, output_cents_per_million, cached_cents_per_million,
    source, source_note, status, review_at, created_by
  ) values (
    ${nid("prc")}, ${ws.orgId}, ${provider}, ${model}, ${num(prior[0]?.version) + 1}, ${inputRate}, ${outputRate}, ${null},
    ${"owner"}, ${"Owner entered. This is not an invoice and it was not fetched from a provider."}, ${"verified"},
    now() + interval '90 days', ${userId}
  )`;
	await audit(sql, ws, userId, "finance.price", ws.orgId, null, `${provider}/${model}`, "A pricing version was recorded. Blank dimensions stay unknown.");
}
async function registerIntegration(sql, userId, input) {
	const name = input.name.trim();
	if (name.length < 2) throw new CompanyError("Name the service.");
	const category = input.category.trim() || "information";
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	await sql`insert into integrations (
    id, organization_id, name, provider, category, status, scopes
  ) values (
    ${nid("int")}, ${ws.orgId}, ${name}, ${name}, ${category}, ${"unverified"}, ${input.scopes.trim().slice(0, 300)}
  )`;
	await audit(sql, ws, userId, "integration.registered", ws.orgId, null, "unverified", `${name} is on the registry. It is not connected.`);
}
function githubError(error) {
	if (error instanceof GithubRefusal) throw new CompanyError(error.message);
	throw error;
}
async function connectGithub(sql, userId, token, allowedRepos) {
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	try {
		await connectGithubAccount(sql, {
			orgId: ws.orgId,
			userId,
			token,
			allowedRepos,
			key: readCredentialKey(process.env.NEXUS_CREDENTIAL_KEY),
			fetchImpl: liveGithubFetch
		});
	} catch (error) {
		githubError(error);
	}
}
async function revokeGithub(sql, userId, mode) {
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	try {
		await revokeGithubAccount(sql, {
			orgId: ws.orgId,
			userId,
			mode
		});
	} catch (error) {
		githubError(error);
	}
}
async function refreshGithub(sql, userId) {
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	try {
		await readGithub(sql, {
			orgId: ws.orgId,
			userId,
			operation: "repos",
			resource: "",
			department: "engineering",
			missionId: "",
			key: readCredentialKey(process.env.NEXUS_CREDENTIAL_KEY),
			fetchImpl: liveGithubFetch
		});
	} catch (error) {
		githubError(error);
	}
}
async function readGithubForDepartment(sql, userId, input) {
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	const page = Number(input.page);
	try {
		await readGithub(sql, {
			orgId: ws.orgId,
			userId,
			operation: input.operation,
			resource: input.resource,
			department: input.department,
			missionId: input.missionId,
			page: Number.isInteger(page) ? page : 1,
			key: readCredentialKey(process.env.NEXUS_CREDENTIAL_KEY),
			fetchImpl: liveGithubFetch
		});
	} catch (error) {
		githubError(error);
	}
}
async function requestExternalAction(sql, userId, input) {
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	const integration = (await sql`select id, status, scopes from integrations
    where id = ${input.integrationId} and organization_id = ${ws.orgId} limit 1`)[0];
	if (!integration) throw new CompanyError("That integration is not in this company.");
	const status = integration.status === "verified" || integration.status === "revoked" ? integration.status : "unverified";
	const actionClass = input.actionClass === 2 || input.actionClass === 3 || input.actionClass === 4 ? input.actionClass : 1;
	const classification = input.classification === "confidential" || input.classification === "public" ? input.classification : "internal";
	const decision = actionDecision({
		actionClass,
		integrationStatus: status,
		scopes: integration.scopes.split(",").map((item) => item.trim()).filter(Boolean),
		operation: input.operation.trim(),
		ownerApproved: false,
		confirmed: false,
		classification,
		caller: "owner"
	});
	const key = `${integration.id}:${input.operation.trim()}:${actionClass}`;
	if ((await sql`select id from external_actions where organization_id = ${ws.orgId} and idempotency_key = ${key} limit 1`)[0]) throw new CompanyError("That action was already requested.");
	const stored = decision.allow ? "permitted_not_executed" : decision.pending ? "pending_owner" : "rejected";
	await sql`insert into external_actions (
    id, organization_id, integration_id, operation, action_class, idempotency_key, status, reason, result, created_by
  ) values (
    ${nid("act")}, ${ws.orgId}, ${integration.id}, ${input.operation.trim()}, ${actionClass}, ${key}, ${stored}, ${decision.reason},
    ${decision.allow ? "Not executed. No live connector is configured for this service." : ""}, ${userId}
  )`;
	await audit(sql, ws, userId, "integration.action", integration.id, null, stored, decision.reason);
}
async function registerDevice(sql, userId, input) {
	const name = input.name.trim();
	if (name.length < 2) throw new CompanyError("Name the device.");
	if (input.permission !== "read" && input.permission !== "control") throw new CompanyError("A device is read or control.");
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	await sql`insert into devices (id, organization_id, name, permission, connected, emergency_stop)
    values (${nid("dev")}, ${ws.orgId}, ${name}, ${input.permission}, ${false}, ${false})`;
	await audit(sql, ws, userId, "device.registered", ws.orgId, null, "disconnected", `${name} is registered. It is not connected, and no reading has been confirmed.`);
}
async function commandDevice(sql, userId, deviceId, operation) {
	const op = operation === "control" || operation === "emergency_stop" ? operation : "read";
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	const device = (await sql`
    select id, permission, connected, emergency_stop from devices where id = ${deviceId} and organization_id = ${ws.orgId} limit 1`)[0];
	if (!device) throw new CompanyError("That device is not in this company.");
	const decision = deviceCommand({
		connected: device.connected === true,
		permission: device.permission === "control" ? "control" : "read",
		operation: op,
		ownerApproved: true,
		emergencyStop: device.emergency_stop === true
	});
	if (op === "emergency_stop" && decision.allow) await sql`update devices set emergency_stop = ${true}, safe_state = ${"stop-requested"} where id = ${device.id}`;
	await sql`insert into device_commands (id, organization_id, device_id, operation, status, reason, claimed)
    values (${nid("cmd")}, ${ws.orgId}, ${device.id}, ${op}, ${decision.allow ? "requested" : "blocked"}, ${decision.reason}, ${false})`;
	await audit(sql, ws, userId, "device.command", device.id, null, decision.state, decision.reason);
}
async function recordObservation(sql, userId, missionId, source, body) {
	const cleanSource = source.trim();
	if (cleanSource.length < 3) throw new CompanyError("Name the source.");
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	const mission = missionId.trim() ? await mustMission(sql, ws.orgId, missionId.trim()) : null;
	const quarantined = quarantineExternal(body);
	await sql`insert into observations (
    id, organization_id, mission_id, source, reference, body, content_sha256, classification, status
  ) values (
    ${nid("obs")}, ${ws.orgId}, ${mission?.id ?? null}, ${cleanSource.slice(0, 200)}, ${cleanSource.slice(0, 300)},
    ${quarantined.observation.slice(0, 4e3)}, ${contentHash(quarantined.observation)}, ${"internal"}, ${"observed"}
  )`;
	await audit(sql, ws, userId, "observation.recorded", mission?.id ?? ws.orgId, null, "observed", "External text was stored as an observation. It was not accepted as knowledge.");
}
async function reserveFunds(sql, userId, input) {
	const cents = dollarsToCents(input.amount);
	if (cents == null) throw new CompanyError("Enter an amount like 25 or 25.00.");
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	let missionId = null;
	if (input.missionId.trim()) missionId = (await mustMission(sql, ws.orgId, input.missionId.trim())).id;
	const kind = input.kind === "estimate" ? "estimate" : "reserved";
	await commitCharge(sql, {
		orgId: ws.orgId,
		missionId,
		department: "",
		amountCents: cents,
		kind: kind === "estimate" ? "estimate" : "reserve",
		write: async (tx) => {
			await tx`insert into commitments (
        id, organization_id, mission_id, department_slug, amount_cents, kind, note, status, created_by
      ) values (
        ${nid("cmt")}, ${ws.orgId}, ${missionId}, ${""}, ${cents}, ${kind}, ${input.note.trim().slice(0, 300)}, ${"open"}, ${userId}
      )`;
		}
	});
	await audit(sql, ws, userId, kind === "estimate" ? "finance.estimate" : "finance.reserved", missionId ?? ws.orgId, null, String(cents), `${formatMoney(cents)} ${kind}. This is not a charge.`);
}
async function proposeSpecification(sql, userId, missionId, body) {
	const clean = body.trim();
	if (clean.length < 8) throw new CompanyError("The specification needs a line of substance.");
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	const mission = await mustMission(sql, ws.orgId, missionId);
	const hash = contentHash(clean);
	const prior = await sql`
    select id, version, content_sha256, body, state from specifications
    where organization_id = ${ws.orgId} and mission_id = ${mission.id} and state = ${"accepted"}
    order by version desc limit 1`;
	if (prior[0]?.content_sha256 === hash) throw new CompanyError("That text matches the accepted specification.");
	const version = num((await sql`select coalesce(max(version), 0)::int as version from specifications where mission_id = ${mission.id}`)[0]?.version) + 1;
	const id = nid("spec");
	await sql`insert into specifications (
    id, organization_id, mission_id, version, content_sha256, body, state, author, supersedes
  ) values (
    ${id}, ${ws.orgId}, ${mission.id}, ${version}, ${hash}, ${clean.slice(0, 12e3)}, ${"proposed"}, ${userId}, ${prior[0]?.id ?? null}
  )`;
	const diff = diffRequirements(requirementsOf(prior[0]?.body ?? ""), requirementsOf(clean));
	const assignments = await loadAssignments(sql, mission.id);
	const impact = traceImpact({
		added: diff.added,
		removed: diff.removed,
		assignments: assignments.map((row) => ({
			id: row.id,
			department: row.department_slug,
			position: row.position,
			brief: row.brief,
			artifact: row.artifact,
			status: row.status
		}))
	});
	await sql`insert into spec_impacts (
    id, organization_id, mission_id, specification_id, prior_specification_id, added, removed,
    affected_assignments, untouched_assignments, affected_departments, revalidation
  ) values (
    ${nid("imp")}, ${ws.orgId}, ${mission.id}, ${id}, ${prior[0]?.id ?? null},
    ${JSON.stringify(diff.added)}::jsonb, ${JSON.stringify(diff.removed)}::jsonb,
    ${JSON.stringify(impact.affectedIds)}::jsonb, ${JSON.stringify(impact.untouchedIds)}::jsonb,
    ${JSON.stringify(impact.departments)}::jsonb, ${"awaiting_owner"}
  )`;
	for (const assignmentId of impact.affectedIds) await sql`insert into revalidations (
      id, organization_id, mission_id, assignment_id, specification_id, spec_version, state
    ) values (
      ${nid("rev")}, ${ws.orgId}, ${mission.id}, ${assignmentId}, ${id}, ${version}, ${"awaiting_owner"}
    )`;
	await audit(sql, ws, userId, "spec.proposed", mission.id, mission.status, mission.status, `Specification v${version} is proposed. ${impact.affectedIds.length} deliverables need review. Nothing was reopened.`);
	await storeRequirements(sql, ws.orgId, mission.id, id, version, prior[0]?.id ?? null, prior[0]?.body ?? "", clean);
}
async function acceptSpecification(sql, userId, missionId) {
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	const mission = await mustMission(sql, ws.orgId, missionId);
	const next = (await sql`
    select id, version, supersedes from specifications
    where organization_id = ${ws.orgId} and mission_id = ${mission.id} and state = ${"proposed"}
    order by version desc limit 1`)[0];
	if (!next) throw new CompanyError("There is no proposed specification to accept.");
	if (next.supersedes) await sql`update specifications set state = ${"superseded"}
      where id = ${next.supersedes} and organization_id = ${ws.orgId} and state = ${"accepted"}`;
	if (!(await sql`update specifications
    set state = ${"accepted"}, approved_by = ${userId}, accepted_at = now()
    where id = ${next.id} and organization_id = ${ws.orgId} and state = ${"proposed"}
    returning id`)[0]) throw new CompanyError("The specification changed before it could be accepted.");
	await sql`update spec_impacts set revalidation = ${readIdList((await sql`select affected_assignments from spec_impacts
    where specification_id = ${next.id} order by created_at desc limit 1`)[0]?.affected_assignments).length > 0 ? "awaiting_owner" : "current"} where specification_id = ${next.id}`;
	await audit(sql, ws, userId, "spec.accepted", mission.id, mission.status, mission.status, `Specification v${num(next.version)} accepted. The mission status was not changed.`);
}
async function authorizeRevalidation(sql, userId, missionId) {
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	const mission = await mustMission(sql, ws.orgId, missionId);
	if (mission.status === "ACCEPTED" || mission.status === "CANCELLED") throw new CompanyError("An accepted mission stays accepted. Open a follow-up mission for the new specification.");
	const rows = await sql`select assignment_id from revalidations
    where organization_id = ${ws.orgId} and mission_id = ${mission.id} and state = ${"awaiting_owner"}`;
	if (rows.length === 0) throw new CompanyError("Nothing is waiting on a revalidation decision.");
	await sql`update revalidations set state = ${"authorized"}, updated_at = now()
    where organization_id = ${ws.orgId} and mission_id = ${mission.id} and state = ${"awaiting_owner"}`;
	await sql`update spec_impacts set revalidation = ${"authorized"}
    where organization_id = ${ws.orgId} and mission_id = ${mission.id} and revalidation = ${"awaiting_owner"}`;
	const assignments = await loadAssignments(sql, mission.id);
	const ids = new Set(rows.map((row) => row.assignment_id));
	const earliest = assignments.filter((row) => ids.has(row.id)).reduce((min, row) => Math.min(min, row.position), Number.POSITIVE_INFINITY);
	for (const row of assignments) {
		if (!Number.isFinite(earliest) || row.position < earliest || !ids.has(row.id)) continue;
		await sql`update assignments set status = ${row.position === earliest ? "READY" : "QUEUED"}, artifact = ${""}, evidence = ${"[]"}::jsonb, model = ${""}, run_token = ${""}, error = ${""}, updated_at = now()
      where id = ${row.id} and organization_id = ${ws.orgId} and status = ${"DONE"}`;
	}
	if (mission.status === "AWAITING_ACCEPTANCE") await moveMission(sql, mission, "EXECUTING", ws, userId, "mission.revalidation", "Owner authorized revalidation of the affected deliverables");
	await audit(sql, ws, userId, "spec.revalidation", mission.id, mission.status, mission.status, "Affected deliverables may be reviewed. Unaffected work was left as it was. Prior QA reports were not rewritten.");
}
async function payments(sql, userId) {
	const ws = await ensureCompany(sql, userId);
	const rows = await sql`select p.id, p.payer, p.amount_cents, p.method, p.destination, p.note, p.voided_at, p.mission_id, m.title as mission_title, p.created_at, p.direction
    from payments p
    left join missions m on m.id = p.mission_id and m.organization_id = p.organization_id
    where p.organization_id = ${ws.orgId}
    order by p.created_at desc limit 40`;
	const total = await sql`select coalesce(sum(amount_cents), 0)::int as total from payments
    where organization_id = ${ws.orgId} and voided_at is null and direction = ${"receipt"}`;
	const missions = await listMissions(sql, ws.orgId);
	return {
		destination: PAYMENT,
		totalCents: num(total[0]?.total),
		rows: rows.map(toPayment),
		missions: missions.map((mission) => ({
			id: mission.id,
			title: mission.title
		})),
		finance: await financeSnapshot(sql, ws.orgId),
		parties: await listParties(sql, ws.orgId),
		offers: await listOffers(sql, ws.orgId)
	};
}
async function recordPayment(sql, userId, input) {
	const payer = input.payer.trim().replace(/\s+/g, " ");
	if (payer.length < 2 || payer.length > 80) throw new CompanyError("Name who paid.");
	const cents = dollarsToCents(input.amount);
	if (cents == null) throw new CompanyError("Enter an amount like 25 or 25.00.");
	const note = input.note.trim().slice(0, 500);
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	let missionId = null;
	let missionTitle = "";
	if (input.missionId.trim()) {
		const mission = await mustMission(sql, ws.orgId, input.missionId.trim());
		missionId = mission.id;
		missionTitle = mission.title;
	}
	const requested = (input.department ?? "").trim();
	const department = DEPARTMENTS$1.some((item) => item.slug === requested) ? requested : "";
	await atomically(sql, async (tx) => {
		await tx`insert into payments (
      id, organization_id, mission_id, payer, amount_cents, method, destination, note, created_by, department_slug, direction
    ) values (
      ${nid("pay")}, ${ws.orgId}, ${missionId}, ${payer}, ${cents}, ${PAYMENT.method}, ${PAYMENT.cashtag}, ${note}, ${userId}, ${department}, ${"receipt"}
    )`;
		await audit(tx, ws, userId, "payment.recorded", missionId ?? ws.orgId, null, null, `${formatMoney(cents)} from ${payer} via ${PAYMENT.method} ${PAYMENT.cashtag}${missionTitle ? ` · ${missionTitle}` : ""}. A receipt does not consume a spending ceiling.`);
	});
}
async function recordExpenditure(sql, userId, input) {
	const payee = input.payer.trim().replace(/\s+/g, " ");
	if (payee.length < 2 || payee.length > 80) throw new CompanyError("Name who was paid.");
	const cents = dollarsToCents(input.amount);
	if (cents == null) throw new CompanyError("Enter an amount like 25 or 25.00.");
	const note = input.note.trim().slice(0, 500);
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	let missionId = null;
	let missionTitle = "";
	if (input.missionId.trim()) {
		const mission = await mustMission(sql, ws.orgId, input.missionId.trim());
		missionId = mission.id;
		missionTitle = mission.title;
	}
	const requested = (input.department ?? "").trim();
	const department = DEPARTMENTS$1.some((item) => item.slug === requested) ? requested : "";
	await commitCharge(sql, {
		orgId: ws.orgId,
		missionId,
		department,
		amountCents: cents,
		kind: "charge",
		write: async (tx) => {
			await tx`insert into payments (
        id, organization_id, mission_id, payer, amount_cents, method, destination, note, created_by, department_slug, direction
      ) values (
        ${nid("pay")}, ${ws.orgId}, ${missionId}, ${payee}, ${cents}, ${"recorded"}, ${"expenditure"}, ${note}, ${userId}, ${department}, ${"expenditure"}
      )`;
			await audit(tx, ws, userId, "payment.spent", missionId ?? ws.orgId, null, null, `${formatMoney(cents)} to ${payee}${missionTitle ? ` · ${missionTitle}` : ""}. This counts against the spending ceiling. It is not a bank transfer.`);
		}
	});
}
async function ownerCompany(sql, userId) {
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	return ws;
}
async function createCompanyParty(sql, userId, input) {
	const ws = await ownerCompany(sql, userId);
	return createParty(sql, {
		orgId: ws.orgId,
		actorId: userId,
		kind: input.kind,
		displayName: input.displayName
	});
}
async function editCompanyParty(sql, userId, input) {
	const ws = await ownerCompany(sql, userId);
	await editParty(sql, {
		orgId: ws.orgId,
		actorId: userId,
		partyId: input.partyId,
		displayName: input.displayName
	});
}
async function archiveCompanyParty(sql, userId, partyId) {
	const ws = await ownerCompany(sql, userId);
	await archiveParty(sql, {
		orgId: ws.orgId,
		actorId: userId,
		partyId
	});
}
async function assignCompanyRole(sql, userId, input) {
	const ws = await ownerCompany(sql, userId);
	return assignRole(sql, {
		orgId: ws.orgId,
		actorId: userId,
		partyId: input.partyId,
		role: input.role
	});
}
async function deactivateCompanyRole(sql, userId, input) {
	const ws = await ownerCompany(sql, userId);
	await deactivateRole(sql, {
		orgId: ws.orgId,
		actorId: userId,
		partyId: input.partyId,
		role: input.role
	});
}
async function reactivateCompanyRole(sql, userId, input) {
	const ws = await ownerCompany(sql, userId);
	await reactivateRole(sql, {
		orgId: ws.orgId,
		actorId: userId,
		partyId: input.partyId,
		role: input.role
	});
}
async function addCompanyContact(sql, userId, input) {
	const ws = await ownerCompany(sql, userId);
	await addContact(sql, {
		orgId: ws.orgId,
		actorId: userId,
		partyId: input.partyId,
		label: input.label,
		value: input.value
	});
}
async function createCompanyOffer(sql, userId, input) {
	const ws = await ownerCompany(sql, userId);
	await createOffer(sql, {
		orgId: ws.orgId,
		actorId: userId,
		kind: input.kind,
		name: input.name,
		price: input.price
	});
}
async function editCompanyOffer(sql, userId, input) {
	const ws = await ownerCompany(sql, userId);
	await editOffer(sql, {
		orgId: ws.orgId,
		actorId: userId,
		offerId: input.offerId,
		name: input.name,
		price: input.price
	});
}
async function retireCompanyOffer(sql, userId, offerId) {
	const ws = await ownerCompany(sql, userId);
	await retireOffer(sql, {
		orgId: ws.orgId,
		actorId: userId,
		offerId
	});
}
async function voidPayment(sql, userId, paymentId) {
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	const payment = (await sql`
    select id, payer, amount_cents, voided_at from payments
    where id = ${paymentId} and organization_id = ${ws.orgId} limit 1`)[0];
	if (!payment) throw new CompanyError("That payment is not in this company.");
	if (payment.voided_at) throw new CompanyError("That payment is already void.");
	await atomically(sql, async (tx) => {
		if (!(await tx`update payments set voided_at = now()
      where id = ${payment.id} and organization_id = ${ws.orgId} and voided_at is null
      returning id`)[0]) throw new CompanyError("That payment changed before it could be voided.");
		await audit(tx, ws, userId, "payment.voided", payment.id, null, null, `${formatMoney(num(payment.amount_cents))} from ${payment.payer} voided. This is not a refund.`);
	});
}
async function missionPayments(sql, orgId, missionId) {
	return (await sql`select p.id, p.payer, p.amount_cents, p.method, p.destination, p.note, p.voided_at, p.mission_id, m.title as mission_title, p.created_at, p.direction
    from payments p
    left join missions m on m.id = p.mission_id and m.organization_id = p.organization_id
    where p.organization_id = ${orgId} and p.mission_id = ${missionId}
    order by p.created_at desc limit 20`).map(toPayment);
}
function readSandbox(suite, value) {
	let parsed = {};
	if (typeof value === "string") try {
		parsed = JSON.parse(value);
	} catch {
		parsed = {};
	}
	else if (value && typeof value === "object") parsed = value;
	if (!suite && Object.keys(parsed).length === 0) return null;
	return {
		suite: suite || (typeof parsed.suite === "string" ? parsed.suite : ""),
		memoryBytes: typeof parsed.memoryBytes === "number" ? parsed.memoryBytes : 0,
		cpuSeconds: typeof parsed.cpuSeconds === "number" ? parsed.cpuSeconds : 0,
		processes: typeof parsed.processes === "number" ? parsed.processes : 0,
		fileBytes: typeof parsed.fileBytes === "number" ? parsed.fileBytes : 0,
		network: typeof parsed.network === "string" ? parsed.network : "",
		filesystem: typeof parsed.filesystem === "string" ? parsed.filesystem : "",
		enforced: parsed.enforced === true,
		policy: typeof parsed.policy === "string" ? parsed.policy : "",
		identity: typeof parsed.identity === "string" ? parsed.identity : "",
		capabilities: typeof parsed.capabilities === "string" ? parsed.capabilities : "",
		proc: typeof parsed.proc === "string" ? parsed.proc : "",
		env: typeof parsed.env === "string" ? parsed.env : "",
		seccomp: typeof parsed.seccomp === "string" ? parsed.seccomp : ""
	};
}
function toPayment(row) {
	const voidedAt = iso(row.voided_at);
	return {
		id: row.id,
		payer: row.payer,
		amountCents: num(row.amount_cents),
		method: row.method,
		destination: row.destination,
		note: row.note,
		voidedAt: voidedAt || null,
		missionId: row.mission_id,
		missionTitle: row.mission_title,
		createdAt: iso(row.created_at),
		direction: row.direction === "expenditure" ? "expenditure" : "receipt"
	};
}
async function produce(sql, orgId, next, objective, strategy, answers, prior, think, memory, defects, executionId, classification) {
	const slug = next.agent_slug;
	const priorText = prior.map((row) => `### ${row.agent_slug}\n${row.artifact.slice(0, 1200)}`).join("\n\n");
	if (slug === "qa") {
		const artifacts = artifactMap([...prior, next]);
		const runtime = await executeArtifact(extractHtml(artifacts.developer ?? ""), objective, executionId);
		const evidence = [...verifyArtifacts(artifacts), {
			name: "Isolated execution",
			passed: runtime.passed && runtime.sandbox.enforced,
			detail: runtime.passed && runtime.sandbox.enforced ? `Ran under OS limits. Hash ${runtime.sha256.slice(0, 12)}. Suite ${runtime.suite}.` : runtime.detail
		}];
		return {
			body: renderVerification(evidence),
			model: "nexus-verifier",
			provider: "local",
			evidence,
			runtime,
			outcome: "succeeded",
			durationMs: null,
			errorCategory: ""
		};
	}
	if (slug === "coo") return {
		body: assemblePacket(objective, artifactMap(prior)),
		model: "nexus-assembly",
		provider: "local",
		evidence: [],
		outcome: "succeeded",
		durationMs: null,
		errorCategory: ""
	};
	const agent = agentBySlug(slug);
	const thought = agent ? await gatedThink(sql, orgId, think, {
		system: systemPrompt(agent),
		user: `Objective:\n${objective}\n\nOwner's answer:\n${answers.trim() || "None yet."}\n\nStrategy:\n${strategy.slice(0, 1500)}\n\nVerified memory from accepted missions:\n${memory || "None yet."}\n\n${defects ? `Open defects. Fix what belongs to you. Do not claim quality passed:\n${defects}\n\n` : ""}Your assignment: ${next.title}\n${next.brief}\n\nPrior work:\n${priorText || "None yet."}`
	}, classification) : {
		text: "",
		model: "",
		provider: "local",
		outcome: "withheld",
		durationMs: 0,
		errorCategory: "No agent"
	};
	let provider = thought.provider;
	let body = thought.text.trim().length >= 80 ? thought.text.trim().slice(0, 12e3) : localDraft(slug, objective, priorText);
	let model = thought.text.trim().length >= 80 ? thought.model || "gpt-oss-20b" : thought.unavailable ? "local-orchestrator · model unavailable" : "local-orchestrator";
	const trial = {
		...artifactMap(prior),
		[slug]: body
	};
	if (!ownedChecksPass(slug, trial)) {
		body = localDraft(slug, objective, priorText);
		model = thought.unavailable ? "local-orchestrator · model unavailable" : "local-orchestrator · repaired";
	}
	if (model.startsWith("local-orchestrator") || model === "nexus-assembly" || model === "nexus-verifier") provider = "local";
	return {
		body,
		model,
		provider,
		evidence: [],
		outcome: thought.outcome ?? (thought.unavailable ? "failed" : "succeeded"),
		durationMs: thought.durationMs ?? null,
		errorCategory: thought.errorCategory ?? ""
	};
}
function artifactMap(rows) {
	const map = {};
	for (const row of rows) if (PIPELINE.includes(row.agent_slug) && row.artifact) map[row.agent_slug] = row.artifact;
	return map;
}
async function listMissions(sql, orgId) {
	return (await sql`select m.id, m.title, m.objective, m.status, m.updated_at, m.priority, m.parent_id,
      (select count(*)::int from assignments a where a.mission_id = m.id and a.status = 'DONE') as done,
      (select count(*)::int from assignments a where a.mission_id = m.id) as total
    from missions m where m.organization_id = ${orgId}
    order by m.priority desc, m.updated_at desc`).flatMap((row) => {
		if (!isMissionStatus(row.status)) return [];
		return [{
			id: row.id,
			title: row.title,
			objective: row.objective,
			status: row.status,
			updatedAt: iso(row.updated_at),
			done: num(row.done),
			total: num(row.total),
			priority: num(row.priority),
			parentId: row.parent_id || null
		}];
	});
}
async function mustMission(sql, orgId, missionId) {
	const mission = (await sql`select id, title, objective, status, strategy, questions, answers, plan_source, depends_on, parent_id, priority, milestone, classification, updated_at
    from missions where id = ${missionId} and organization_id = ${orgId} limit 1`)[0];
	if (!mission || !isMissionStatus(mission.status)) throw new CompanyError("That mission is not in this company.");
	mission.answers = mission.answers ?? "";
	mission.depends_on = mission.depends_on || null;
	mission.parent_id = mission.parent_id || null;
	mission.priority = num(mission.priority);
	mission.milestone = mission.milestone ?? "";
	mission.classification = mission.classification === "confidential" ? "confidential" : "internal";
	return mission;
}
async function loadAssignments(sql, missionId) {
	return (await sql`select id, agent_slug, department_slug, title, brief, position, status, artifact, evidence, model, error
    from assignments where mission_id = ${missionId} order by position`).map((row) => ({
		...row,
		position: Number(row.position)
	}));
}
function toAssignment(row) {
	return {
		id: row.id,
		agent: row.agent_slug,
		agentName: agentBySlug(row.agent_slug)?.name ?? row.agent_slug,
		department: row.department_slug,
		title: row.title,
		brief: row.brief,
		position: row.position,
		status: row.status,
		artifact: row.artifact,
		evidence: readChecks(row.evidence),
		model: row.model.startsWith("run_") ? "" : row.model,
		error: row.error
	};
}
async function releaseStaleRuns(sql, ws, missionId) {
	if (await expireLeases(sql, missionId) > 0) await audit(sql, ws, "svc:nexus", "assignment.recovered", missionId, "RUNNING", "READY", "The lease expired before the run could save.");
	if (!(await sql`update assignments
    set status = ${"READY"}, model = ${""}, run_token = ${""}, error = ${"The run stopped before it wrote an artifact."}, updated_at = now()
    where mission_id = ${missionId} and organization_id = ${ws.orgId} and status = ${"RUNNING"}
      and updated_at < now() - interval '90 seconds'
    returning id`)[0]) return;
	await audit(sql, ws, "svc:nexus", "assignment.recovered", missionId, "RUNNING", "READY", "The run stopped before it wrote an artifact");
}
async function offerIfReady(sql, ws, mission, assignments) {
	if (mission.status !== "EXECUTING") return;
	if (assignments.length === 0 || assignments.some((row) => row.status !== "DONE")) return;
	const qa = assignments.find((row) => row.agent_slug === "qa");
	if (!qa || !allPassed(readChecks(qa.evidence))) return;
	const reports = await sql`select status, artifact_sha256 from qa_reports
    where organization_id = ${ws.orgId} and mission_id = ${mission.id}
    order by created_at desc limit 1`;
	const implementation = assignments.find((row) => row.agent_slug === "developer")?.artifact ?? "";
	if (!reports[0] || !evidenceStillCovers(reports[0].artifact_sha256, sha256(extractHtml(implementation)), reports[0].status)) return;
	await moveMission(sql, mission, "AWAITING_ACCEPTANCE", ws, "svc:nexus", "mission.awaiting", "Packet ready for the owner");
}
async function moveMission(sql, mission, to, ws, actorId, action, detail) {
	assertMissionTransition(mission.status, to);
	if (!(await sql`update missions set status = ${to}, updated_at = now()
    where id = ${mission.id} and organization_id = ${ws.orgId} and status = ${mission.status}
    returning id`)[0]) throw new CompanyError("The mission changed before this action could apply.");
	const from = mission.status;
	await audit(sql, ws, actorId, action, mission.id, from, to, detail);
	applyTransition(mission, to, () => void 0);
}
async function openDefects(sql, missionId) {
	return (await sql`
    select id, check_name, detail from defects
    where mission_id = ${missionId} and status = ${"open"}
    order by created_at`).map((row) => ({
		id: row.id,
		name: row.check_name,
		detail: row.detail
	}));
}
async function recordDefects(sql, orgId, missionId, checks) {
	const open = await openDefects(sql, missionId);
	const change = nextDefects(open.map((row) => row.name), checks);
	for (const name of change.close) await sql`update defects set status = ${"closed"}
      where mission_id = ${missionId} and check_name = ${name} and status = ${"open"}`;
	for (const check of checks) {
		if (check.passed || change.create.every((item) => item.name !== check.name)) continue;
		await sql`insert into defects (id, organization_id, mission_id, check_name, detail, status)
      values (${nid("def")}, ${orgId}, ${missionId}, ${check.name}, ${check.detail.slice(0, 500)}, ${"open"})`;
	}
	for (const check of checks) {
		if (check.passed) continue;
		await sql`update defects set detail = ${check.detail.slice(0, 500)}
      where mission_id = ${missionId} and check_name = ${check.name} and status = ${"open"}`;
	}
}
async function closeDefects(sql, missionId) {
	await sql`update defects set status = ${"closed"} where mission_id = ${missionId} and status = ${"open"}`;
}
async function commitCharge(sql, input) {
	if (!sql.transaction) throw new CompanyError("The budget lock is unavailable. Nothing was recorded.");
	await sql.transaction(async (tx) => {
		await tx`insert into portfolio_limits (organization_id, max_concurrent) values (${input.orgId}, 1)
      on conflict (organization_id) do nothing`;
		await tx`select spending_ceiling_cents from portfolio_limits where organization_id = ${input.orgId} for update`;
		const ceiling = await tx`select spending_ceiling_cents from portfolio_limits where organization_id = ${input.orgId}`;
		const companySpent = await tx`select coalesce(sum(amount_cents), 0)::int as total from payments
      where organization_id = ${input.orgId} and voided_at is null and direction = ${"expenditure"}`;
		const companyReserved = await tx`select coalesce(sum(amount_cents), 0)::int as total from commitments
      where organization_id = ${input.orgId} and status = ${"open"} and kind = ${"reserved"}`;
		const missionSpent = input.missionId ? await tx`select coalesce(sum(amount_cents), 0)::int as total from payments
          where mission_id = ${input.missionId} and voided_at is null and direction = ${"expenditure"}` : [{ total: 0 }];
		const missionReserved = input.missionId ? await tx`select coalesce(sum(amount_cents), 0)::int as total from commitments
          where mission_id = ${input.missionId} and status = ${"open"} and kind = ${"reserved"}` : [{ total: 0 }];
		const missionBudget = input.missionId ? await tx`select budget_cents from missions where id = ${input.missionId}` : [];
		const departmentBudget = input.department ? await tx`select amount_cents from department_budgets
          where organization_id = ${input.orgId} and department_slug = ${input.department}` : [];
		const departmentSpent = input.department ? await tx`select coalesce(sum(amount_cents), 0)::int as total from payments
          where organization_id = ${input.orgId} and department_slug = ${input.department} and voided_at is null and direction = ${"expenditure"}` : [{ total: 0 }];
		const departmentReserved = input.department ? await tx`select coalesce(sum(amount_cents), 0)::int as total from commitments
          where organization_id = ${input.orgId} and department_slug = ${input.department} and status = ${"open"} and kind = ${"reserved"}` : [{ total: 0 }];
		const decision = budgetDecision({
			ceilingCents: ceiling[0]?.spending_ceiling_cents == null ? null : num(ceiling[0]?.spending_ceiling_cents),
			missionBudgetCents: missionBudget[0]?.budget_cents == null ? null : num(missionBudget[0]?.budget_cents),
			departmentBudgetCents: departmentBudget[0] ? num(departmentBudget[0].amount_cents) : null,
			companySpent: num(companySpent[0]?.total),
			companyReserved: num(companyReserved[0]?.total),
			missionSpent: num(missionSpent[0]?.total),
			missionReserved: num(missionReserved[0]?.total),
			departmentSpent: num(departmentSpent[0]?.total),
			departmentReserved: num(departmentReserved[0]?.total),
			amountCents: input.amountCents,
			kind: input.kind
		});
		if (!decision.allow) throw new CompanyError(decision.reason);
		await input.write(tx);
	});
}
async function financeSnapshot(sql, orgId) {
	const ceiling = await sql`select spending_ceiling_cents from portfolio_limits where organization_id = ${orgId}`;
	const spent = await sql`select coalesce(sum(amount_cents), 0)::int as total from payments
    where organization_id = ${orgId} and voided_at is null and direction = ${"expenditure"}`;
	const received = await sql`select coalesce(sum(amount_cents), 0)::int as total from payments
    where organization_id = ${orgId} and voided_at is null and direction = ${"receipt"}`;
	const reserved = await sql`select coalesce(sum(amount_cents), 0)::int as total from commitments
    where organization_id = ${orgId} and status = ${"open"} and kind = ${"reserved"}`;
	const estimates = await sql`select coalesce(sum(amount_cents), 0)::int as total from commitments
    where organization_id = ${orgId} and status = ${"open"} and kind = ${"estimate"}`;
	const ceilingCents = ceiling[0]?.spending_ceiling_cents == null ? null : num(ceiling[0]?.spending_ceiling_cents);
	const spentCents = num(spent[0]?.total);
	const reservedCents = num(reserved[0]?.total);
	return {
		ceilingCents,
		spentCents,
		receivedCents: num(received[0]?.total),
		reservedCents,
		estimateCents: num(estimates[0]?.total),
		remainingCents: ceilingCents == null ? null : ceilingCents - spentCents - reservedCents,
		utilization: ceilingCents != null && ceilingCents > 0 ? (spentCents + reservedCents) / ceilingCents : null
	};
}
async function recentChanges(sql, orgId) {
	return (await sql`select i.id, i.mission_id, s.version, s.state, i.revalidation, i.added, i.removed, i.affected_assignments
    from spec_impacts i
    join specifications s on s.id = i.specification_id
    where i.organization_id = ${orgId}
    order by i.created_at desc limit 8`).map((row) => ({
		id: row.id,
		missionId: row.mission_id,
		version: num(row.version),
		state: row.state,
		revalidation: row.revalidation,
		added: listCount(row.added),
		removed: listCount(row.removed),
		affected: listCount(row.affected_assignments)
	}));
}
async function providerSnapshot(sql, orgId) {
	const rows = await sql`
    select provider, model, outcome, duration_ms, created_at from model_dispatches
    where organization_id = ${orgId}
    order by created_at asc limit 200`;
	const groups = /* @__PURE__ */ new Map();
	for (const row of rows) {
		const key = `${row.provider}:${row.model}`;
		const group = groups.get(key) ?? {
			provider: row.provider,
			model: row.model,
			rows: []
		};
		const outcome = row.outcome === "succeeded" || row.outcome === "failed" || row.outcome === "timeout" || row.outcome === "withheld" || row.outcome === "unspecified" ? row.outcome : "unspecified";
		group.rows.push({
			outcome,
			durationMs: row.duration_ms == null ? null : num(row.duration_ms),
			at: iso(row.created_at)
		});
		groups.set(key, group);
	}
	if (groups.size === 0) return [{
		provider: "none",
		model: "",
		...reliabilityOf([])
	}];
	return [...groups.values()].map((group) => ({
		provider: group.provider,
		model: group.model,
		...reliabilityOf(group.rows)
	}));
}
async function recordAcceptedSpecification(sql, orgId, missionId, userId, strategy, product) {
	const body = [strategy.trim(), product.trim()].filter(Boolean).join("\n\n");
	if (body.length < 8) return;
	const hash = contentHash(body);
	if ((await sql`select id from specifications
    where organization_id = ${orgId} and mission_id = ${missionId} and state = ${"accepted"} and content_sha256 = ${hash} limit 1`)[0]) return;
	if ((await sql`select id from specifications
    where organization_id = ${orgId} and mission_id = ${missionId} and state = ${"accepted"} limit 1`)[0]) return;
	const versions = await sql`select coalesce(max(version), 0)::int as version from specifications where mission_id = ${missionId}`;
	await sql`insert into specifications (
    id, organization_id, mission_id, version, content_sha256, body, state, author, approved_by, accepted_at
  ) values (
    ${nid("spec")}, ${orgId}, ${missionId}, ${num(versions[0]?.version) + 1}, ${hash}, ${body.slice(0, 12e3)},
    ${"accepted"}, ${userId}, ${userId}, now()
  )`;
}
function listCount(value) {
	const parsed = typeof value === "string" ? safeJson(value) : value;
	return Array.isArray(parsed) ? parsed.length : 0;
}
function readIdList(value) {
	const parsed = typeof value === "string" ? safeJson(value) : value;
	return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
}
function safeJson(value) {
	try {
		return JSON.parse(value);
	} catch {
		return [];
	}
}
function rateOrNull(raw) {
	const trimmed = raw.trim();
	if (!trimmed) return null;
	if (!/^\d+$/.test(trimmed)) return null;
	const value = Number(trimmed);
	return Number.isSafeInteger(value) ? value : null;
}
async function readCostPolicy(sql, orgId) {
	return (await sql`select unknown_cost from cost_policy where organization_id = ${orgId}`)[0]?.unknown_cost === "refuse" ? "refuse" : "record_unknown";
}
async function pricedQuote(sql, orgId, provider, model, inputTokens, outputTokens, cachedTokens) {
	const row = (await sql`select id, version, status, review_at, input_cents_per_million, output_cents_per_million, cached_cents_per_million
    from provider_prices
    where organization_id = ${orgId} and provider = ${provider} and model = ${model}
    order by version desc limit 1`)[0];
	const quote = quoteCost({
		price: row ? {
			version: num(row.version),
			status: row.status === "verified" || row.status === "expired" ? row.status : "unverified",
			reviewAt: iso(row.review_at),
			inputCentsPerMillion: row.input_cents_per_million == null ? null : num(row.input_cents_per_million),
			outputCentsPerMillion: row.output_cents_per_million == null ? null : num(row.output_cents_per_million),
			cachedCentsPerMillion: row.cached_cents_per_million == null ? null : num(row.cached_cents_per_million)
		} : null,
		now: (/* @__PURE__ */ new Date()).toISOString(),
		inputTokens,
		outputTokens,
		cachedTokens
	});
	return {
		kind: quote.kind === "estimate" ? "estimate" : "unknown",
		cents: quote.cents,
		pricingVersion: quote.pricingVersion,
		pricingId: row?.id ?? null,
		reason: quote.reason
	};
}
async function storeRequirements(sql, orgId, missionId, specificationId, version, priorId, before, after) {
	const priorRows = priorId ? await sql`select requirement_key, body from requirements
        where specification_id = ${priorId} and change <> ${"removed"}` : [];
	const related = relateRequirements(priorRows.length > 0 ? priorRows.map((row) => ({
		key: row.requirement_key,
		text: row.body
	})) : requirementsOf(before).map((row) => ({
		key: row.id,
		text: row.text
	})), requirementsOf(after).map((row) => ({
		key: row.id,
		text: row.text
	})));
	const writes = [
		...related.unchanged.map((row) => ({
			key: row.key,
			text: row.text,
			change: "unchanged",
			priorKey: null
		})),
		...related.modified.map((row) => ({
			key: row.key,
			text: row.text,
			change: "modified",
			priorKey: row.priorKey
		})),
		...related.added.map((row) => ({
			key: row.key,
			text: row.text,
			change: "added",
			priorKey: null
		})),
		...related.removed.map((row) => ({
			key: row.key,
			text: row.text,
			change: "removed",
			priorKey: row.key
		})),
		...related.ambiguous.map((row) => ({
			key: row.key,
			text: row.text,
			change: "ambiguous",
			priorKey: null
		}))
	];
	for (const row of writes) await sql`insert into requirements (
      id, organization_id, mission_id, specification_id, spec_version, requirement_key, body, change, prior_key
    ) values (
      ${nid("req")}, ${orgId}, ${missionId}, ${specificationId}, ${version}, ${row.key}, ${row.text}, ${row.change}, ${row.priorKey}
    )`;
}
async function githubSnapshot(sql, orgId) {
	const row = (await sql`select id, status, account_login, scopes, credential_hint, rate_remaining, rate_reset, last_success_at, last_failure, last_sync_at, poll_minutes
    from github_connections where organization_id = ${orgId} order by updated_at desc limit 1`)[0];
	if (!row) return {
		status: "not connected",
		account: "",
		scopes: "",
		hint: "",
		rate: "",
		lastSuccess: null,
		lastFailure: "",
		lastSync: null,
		polling: "No GitHub account is connected. Nothing is being polled.",
		repos: [],
		recent: []
	};
	const repos = await sql`select owner_name, repo_name, private from github_repos
    where connection_id = ${row.id} order by updated_at desc limit 12`;
	const recent = await sql`
    select operation, resource, http_status, result, created_at from github_reads
    where connection_id = ${row.id} order by created_at desc limit 8`;
	const lastSync = row.last_sync_at ? iso(row.last_sync_at) : null;
	const due = row.status === "connected" && pollDue(lastSync, num(row.poll_minutes) || 60, Date.now());
	return {
		status: row.status,
		account: row.account_login,
		scopes: row.scopes,
		hint: row.credential_hint,
		rate: row.rate_remaining ? `${row.rate_remaining} remaining` : "",
		lastSuccess: row.last_success_at ? iso(row.last_success_at) : null,
		lastFailure: row.last_failure,
		lastSync,
		polling: due ? `A refresh is due. It has not run by itself. Interval on record: ${num(row.poll_minutes) || 60} minutes. This is not continuous monitoring.` : `Manual refresh. Interval on record: ${num(row.poll_minutes) || 60} minutes. This is not continuous monitoring.`,
		repos: repos.map((repo) => ({
			fullName: `${repo.owner_name}/${repo.repo_name}`,
			private: repo.private === true
		})),
		recent: recent.map((item) => ({
			operation: item.operation,
			resource: item.resource,
			httpStatus: num(item.http_status),
			result: item.result,
			createdAt: iso(item.created_at)
		}))
	};
}
async function worldSnapshot(sql, orgId) {
	const policy = await readCostPolicy(sql, orgId);
	const prices = await sql`select count(*)::int as count from provider_prices where organization_id = ${orgId}`;
	const unknownCosts = await sql`select count(*)::int as count from cost_records where organization_id = ${orgId} and kind = ${"unknown"}`;
	const estimates = await sql`select count(*)::int as count from cost_records where organization_id = ${orgId} and kind = ${"estimate"}`;
	const forecast = forecastCost((await sql`select cents from cost_records where organization_id = ${orgId} and kind = ${"estimate"} order by created_at desc limit 20`).map((row) => ({ cents: row.cents == null ? null : num(row.cents) })));
	const integrations = await sql`
    select id, name, category, status from integrations where organization_id = ${orgId} order by created_at desc limit 8`;
	const pending = await sql`select count(*)::int as count from external_actions where organization_id = ${orgId} and status = ${"pending_owner"}`;
	const devices = await sql`
    select id, name, connected, emergency_stop, permission from devices where organization_id = ${orgId} order by created_at desc limit 8`;
	const observations = await sql`select count(*)::int as count from observations where organization_id = ${orgId}`;
	const proposed = await sql`select count(*)::int as count from maintenance_actions where organization_id = ${orgId} and status = ${"proposed"}`;
	const applied = await sql`select count(*)::int as count from maintenance_actions where organization_id = ${orgId} and status = ${"applied"}`;
	const outbox = await outboxSnapshot(sql, orgId);
	return {
		policy,
		prices: num(prices[0]?.count),
		unknownCosts: num(unknownCosts[0]?.count),
		estimates: num(estimates[0]?.count),
		forecast: forecast.note,
		integrations: integrations.map((row) => ({
			id: row.id,
			name: row.name,
			category: row.category,
			label: connectionLabel(row.status)
		})),
		pendingActions: num(pending[0]?.count),
		devices: devices.map((row) => ({
			id: row.id,
			name: row.name,
			connected: row.connected === true,
			emergencyStop: row.emergency_stop === true,
			permission: row.permission
		})),
		observations: num(observations[0]?.count),
		maintenanceProposed: num(proposed[0]?.count),
		maintenanceApplied: num(applied[0]?.count),
		outboxPending: outbox.pending + outbox.processing + outbox.failed,
		outboxDead: outbox.dead,
		github: await githubSnapshot(sql, orgId)
	};
}
async function readCapacity(sql, orgId) {
	const value = num((await sql`select max_concurrent from portfolio_limits where organization_id = ${orgId}`)[0]?.max_concurrent);
	return value >= 1 && value <= 8 ? value : 1;
}
async function syncFindings(sql, orgId) {
	const missions = await sql`select m.id, m.title, m.status, m.priority, m.parent_id, m.depends_on, dep.status as dependency_status, m.updated_at,
      (select count(*)::int from defects d where d.mission_id = m.id and d.status = ${"open"}) as open_defects,
      (select coalesce(max(j.attempt), 0)::int from execution_jobs j where j.mission_id = m.id) as retries,
      exists(select 1 from assignments a where a.mission_id = m.id and a.status = ${"RUNNING"}) as running
    from missions m
    left join missions dep on dep.id = m.depends_on and dep.organization_id = m.organization_id
    where m.organization_id = ${orgId}`;
	const knowledge = await sql`
    select id, title, state, confidence from knowledge_entries
    where organization_id = ${orgId} and confidence = ${"contested"} and state <> ${"superseded"}`;
	const facts = missions.map((row) => ({
		id: row.id,
		title: row.title,
		status: row.status,
		priority: num(row.priority),
		parentId: row.parent_id || null,
		dependsOn: row.depends_on || null,
		dependencyStatus: row.dependency_status,
		updatedAtMs: Date.parse(iso(row.updated_at)) || Date.now(),
		openDefects: num(row.open_defects),
		retries: num(row.retries),
		running: row.running === true || row.running === "t"
	}));
	const drafts = deriveFindings({
		nowMs: Date.now(),
		stallMs: 216e5,
		missions: facts,
		knowledge
	});
	const open = await sql`select id, finding_key from findings
    where organization_id = ${orgId} and status = ${"open"}`;
	const live = new Set(drafts.map((item) => item.key));
	for (const row of open) if (!live.has(row.finding_key)) await sql`update findings set status = ${"resolved"}, updated_at = now() where id = ${row.id} and status = ${"open"}`;
	for (const draft of drafts) {
		const existing = open.find((row) => row.finding_key === draft.key);
		if (existing) await sql`update findings set
        severity = ${draft.severity}, title = ${draft.title}, evidence = ${draft.evidence},
        recommendation = ${draft.recommendation}, confidence = ${draft.confidence},
        owner_required = ${draft.ownerRequired}, mission_id = ${draft.missionId}, updated_at = now()
        where id = ${existing.id}`;
		else await sql`insert into findings (
        id, organization_id, mission_id, finding_key, severity, title, evidence, recommendation, confidence, owner_required, status
      ) values (
        ${nid("find")}, ${orgId}, ${draft.missionId}, ${draft.key}, ${draft.severity}, ${draft.title},
        ${draft.evidence}, ${draft.recommendation}, ${draft.confidence}, ${draft.ownerRequired}, ${"open"}
      )`;
	}
	return (await sql`select id, mission_id, severity, title, evidence, recommendation, confidence, owner_required from findings
    where organization_id = ${orgId} and status = ${"open"}
    order by case severity when 'blocking' then 0 when 'watch' then 1 else 2 end, updated_at desc
    limit 12`).map((row) => ({
		id: row.id,
		missionId: row.mission_id,
		severity: row.severity,
		title: row.title,
		evidence: row.evidence,
		recommendation: row.recommendation,
		confidence: row.confidence,
		ownerRequired: row.owner_required === true || row.owner_required === "t"
	}));
}
async function resourceSnapshot(sql, orgId) {
	const running = await sql`select count(*)::int as count from assignments
    where organization_id = ${orgId} and status = ${"RUNNING"}`;
	const queue = await sql`select count(*)::int as count from assignments a
    join missions m on m.id = a.mission_id
    where a.organization_id = ${orgId} and a.status = ${"READY"} and m.status in ('AUTHORIZED', 'EXECUTING')`;
	const qa = await sql`select status, count(*)::int as count from qa_reports
    where organization_id = ${orgId} group by status`;
	const dispatches = await sql`select count(*)::int as count from model_dispatches where organization_id = ${orgId}`;
	const duration = await sql`select count(*)::int as count,
      avg(extract(epoch from (updated_at - created_at))) as seconds
    from execution_jobs where organization_id = ${orgId} and status = ${"done"}`;
	const reused = await sql`select count(*)::int as count from knowledge_uses where organization_id = ${orgId}`;
	const knowledge = await sql`
    select state, confidence, count(*)::int as count from knowledge_entries
    where organization_id = ${orgId} group by state, confidence`;
	const done = num(duration[0]?.count);
	let contested = 0;
	let acceptedKnowledge = 0;
	for (const row of knowledge) {
		if (row.confidence === "contested") contested += num(row.count);
		if (row.state === "accepted") acceptedKnowledge += num(row.count);
	}
	return {
		running: num(running[0]?.count),
		capacity: await readCapacity(sql, orgId),
		queue: num(queue[0]?.count),
		qaPassed: num(qa.find((row) => row.status === "passed")?.count),
		qaFailed: num(qa.find((row) => row.status === "failed")?.count),
		dispatches: num(dispatches[0]?.count),
		avgDurationMs: done > 0 && duration[0]?.seconds != null ? Math.round(Number(duration[0].seconds) * 1e3) : null,
		reused: num(reused[0]?.count),
		contested,
		acceptedKnowledge
	};
}
async function recentHandoffs(sql, orgId) {
	return (await sql`
    select id, mission_id, from_department, to_department, created_at from handoffs
    where organization_id = ${orgId} order by created_at desc limit 6`).map((row) => ({
		id: row.id,
		missionId: row.mission_id,
		fromDepartment: row.from_department,
		toDepartment: row.to_department,
		createdAt: iso(row.created_at)
	}));
}
async function missionHandoffs(sql, missionId) {
	return (await sql`select id, from_department, to_department, completed, outstanding, risks, criteria, created_at from handoffs
    where mission_id = ${missionId} order by created_at desc limit 6`).map((row) => ({
		id: row.id,
		fromDepartment: row.from_department,
		toDepartment: row.to_department,
		completed: row.completed,
		outstanding: row.outstanding,
		risks: row.risks,
		criteria: row.criteria,
		createdAt: iso(row.created_at)
	}));
}
async function memoryRows(sql, orgId, excludeMissionId) {
	return sql`select id, title, body from knowledge_entries
    where organization_id = ${orgId} and verified = ${true} and state = ${"accepted"}
      and (mission_id is null or mission_id <> ${excludeMissionId})
    order by created_at desc limit 4`;
}
async function memoryTitles(sql, orgId, excludeMissionId) {
	return (await memoryRows(sql, orgId, excludeMissionId)).map((row) => row.title).filter((title) => title.trim().length > 0);
}
async function memoryBrief(sql, orgId, excludeMissionId) {
	const rows = await memoryRows(sql, orgId, excludeMissionId);
	return {
		text: rows.map((row) => `- ${row.title}: ${row.body.replace(/\s+/g, " ").trim().slice(0, 480)}`).join("\n"),
		ids: rows.map((row) => row.id)
	};
}
async function noteReuse(sql, orgId, missionId, ids) {
	for (const id of ids) await sql`insert into knowledge_uses (id, organization_id, knowledge_id, mission_id)
      values (${nid("use")}, ${orgId}, ${id}, ${missionId})`;
}
async function remember(sql, orgId, missionId, kind, title, body, source, verified) {
	const prior = await sql`select id, body from knowledge_entries
    where organization_id = ${orgId} and title = ${title} and state = ${"accepted"}
    order by created_at desc limit 1`;
	const versions = await sql`select coalesce(max(version), 0)::int as version
    from knowledge_entries where organization_id = ${orgId} and mission_id = ${missionId} and title = ${title}`;
	const decision = nextMemory({
		verified,
		priorId: prior[0]?.id ?? null,
		priorBody: prior[0]?.body ?? null,
		body,
		version: num(versions[0]?.version) + 1
	});
	if (decision.supersedePrior && decision.supersedes) await sql`update knowledge_entries set state = ${"superseded"}, verified = ${false}
      where id = ${decision.supersedes} and state = ${"accepted"}`;
	await sql`insert into knowledge_entries (
    id, organization_id, mission_id, kind, title, body, source, verified, version, state, confidence, supersedes, evidence_ref
  ) values (
    ${nid("mem")}, ${orgId}, ${missionId}, ${kind}, ${title}, ${body.slice(0, 8e3)}, ${source}, ${verified},
    ${decision.version}, ${decision.state}, ${decision.confidence}, ${decision.supersedes}, ${missionId}
  )`;
}
async function audit(sql, ws, actorId, action, target, from, to, detail) {
	const kind = actorId.startsWith("svc:") || actorId === "nexus-verifier" || actorId === "nexus-assembly" || actorId.includes("grok") ? "service" : "human";
	await sql`insert into audit_events (
    id, organization_id, project_id, task_id, actor_id, actor_kind, action, target, from_state, to_state, detail
  ) values (
    ${nid("aud")}, ${ws.orgId}, ${null}, ${null}, ${actorId}, ${kind}, ${action}, ${target}, ${from}, ${to}, ${detail.slice(0, 500)}
  )`;
}
async function ensureCompany(sql, userId) {
	const existing = await sql`
    select o.id as org_id, m.role as role, o.name as name
    from memberships m join organizations o on o.id = m.organization_id
    where m.user_id = ${userId} limit 1`;
	let ws;
	if (existing[0]) ws = {
		orgId: existing[0].org_id,
		role: existing[0].role,
		orgName: existing[0].name
	};
	else {
		const orgId = nid("org");
		try {
			await sql`insert into organizations (id, name, owner_user_id) values (${orgId}, ${"My Workspace"}, ${userId})`;
			await sql`insert into memberships (id, organization_id, user_id, role) values (${nid("mbr")}, ${orgId}, ${userId}, ${"owner"})`;
		} catch (error) {
			if (!isUnique(error)) throw error;
			const again = await sql`
        select o.id as org_id, m.role as role, o.name as name
        from memberships m join organizations o on o.id = m.organization_id
        where m.user_id = ${userId} limit 1`;
			if (!again[0]) throw new CompanyError("Could not open the company.");
			ws = {
				orgId: again[0].org_id,
				role: again[0].role,
				orgName: again[0].name
			};
			await seed(sql, ws.orgId);
			await sql`insert into scheduler_state (organization_id, status)
        values (${ws.orgId}, ${"paused"})
        on conflict (organization_id) do nothing`;
			return ws;
		}
		await sql`insert into audit_events (
      id, organization_id, project_id, task_id, actor_id, actor_kind, action, target, from_state, to_state, detail
    ) values (
      ${nid("aud")}, ${orgId}, ${null}, ${null}, ${userId}, ${"human"}, ${"organization.created"}, ${orgId},
      ${null}, ${null}, ${"Workspace opened"}
    )`;
		ws = {
			orgId,
			role: "owner",
			orgName: "My Workspace"
		};
	}
	await seed(sql, ws.orgId);
	await sql`insert into scheduler_state (organization_id, status)
    values (${ws.orgId}, ${"paused"})
    on conflict (organization_id) do nothing`;
	return ws;
}
async function seed(sql, orgId) {
	const counts = await sql`
    select
      (select count(*)::int from departments where organization_id = ${orgId}) as departments,
      (select count(*)::int from agents where organization_id = ${orgId}) as agents`;
	if (num(counts[0]?.departments) >= DEPARTMENTS$1.length && num(counts[0]?.agents) >= AGENTS.length) return;
	const have = await sql`select slug from departments where organization_id = ${orgId}`;
	const present = new Set(have.map((row) => row.slug));
	const ids = /* @__PURE__ */ new Map();
	for (const department of DEPARTMENTS$1) {
		if (present.has(department.slug)) {
			const row = await sql`select id from departments where organization_id = ${orgId} and slug = ${department.slug}`;
			if (row[0]) ids.set(department.slug, row[0].id);
			continue;
		}
		const id = nid("dep");
		ids.set(department.slug, id);
		await sql`insert into departments (id, organization_id, slug, name, mandate)
      values (${id}, ${orgId}, ${department.slug}, ${department.name}, ${department.mandate})`;
	}
	for (const agent of AGENTS) {
		const departmentId = ids.get(agent.department);
		if (!departmentId) continue;
		if ((await sql`select id from agents where organization_id = ${orgId} and slug = ${agent.slug}`)[0]) continue;
		await sql`insert into agents (
      id, organization_id, department_id, slug, name, title, responsibility, reports_to, permission_level
    ) values (
      ${nid("agt")}, ${orgId}, ${departmentId}, ${agent.slug}, ${agent.name}, ${agent.title},
      ${agent.responsibility}, ${agent.reportsTo}, ${agent.level}
    )`;
	}
}
async function readDisclosure(sql, orgId) {
	return (await sql`select model_disclosure from organizations where id = ${orgId}`)[0]?.model_disclosure === "local" ? "local" : "public";
}
async function setDisclosure(sql, userId, policy) {
	if (policy !== "local" && policy !== "public") throw new CompanyError("The model policy is local or public.");
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	await sql`update organizations set model_disclosure = ${policy} where id = ${ws.orgId}`;
	await audit(sql, ws, userId, "model.disclosure", ws.orgId, null, null, policy === "public" ? "Public model enabled. Internal objectives may be sent to the free endpoint. Confidential objectives stay here." : "Local only. Objectives stay in this workspace.");
}
async function setScheduler(sql, userId, status) {
	if (status !== "running" && status !== "paused" && status !== "stopped") throw new CompanyError("The scheduler is running, paused, or stopped.");
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	await sql`insert into scheduler_state (organization_id, status)
    values (${ws.orgId}, ${status})
    on conflict (organization_id) do update set status = ${status}, last_error = ${""}, updated_at = now()`;
	await audit(sql, ws, userId, "scheduler.status", ws.orgId, null, status, status === "running" ? "Scheduler running. Authorized departments may start. Acceptance stays with the owner." : status === "paused" ? "Scheduler paused. Work already running can finish. Nothing new starts." : "Scheduler stopped. Nothing new starts.");
}
async function setClassification(sql, userId, missionId, classification) {
	if (classification !== "internal" && classification !== "confidential") throw new CompanyError("Classification is internal or confidential.");
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	const mission = await mustMission(sql, ws.orgId, missionId);
	if (mission.status !== "PROPOSED" && mission.status !== "PLANNED" && mission.status !== "REJECTED") throw new CompanyError("Classification can only change before execution.");
	if (!(await sql`update missions set classification = ${classification}, updated_at = now()
    where id = ${mission.id} and organization_id = ${ws.orgId} and status = ${mission.status}
    returning id`)[0]) throw new CompanyError("The mission changed before classification could be saved.");
	await audit(sql, ws, userId, "mission.classification", mission.id, mission.status, mission.status, classification);
}
async function readScheduler(sql, orgId) {
	const rows = await sql`
    select status, last_tick_at, last_error from scheduler_state where organization_id = ${orgId}`;
	const status = rows[0]?.status === "running" || rows[0]?.status === "stopped" ? rows[0].status : "paused";
	const queued = await sql`select count(*)::int as count from assignments a
    join missions m on m.id = a.mission_id
    where a.organization_id = ${orgId} and a.status = ${"READY"} and m.status in ('AUTHORIZED', 'EXECUTING')`;
	return {
		status,
		lastTick: rows[0]?.last_tick_at ? iso(rows[0].last_tick_at) : null,
		lastError: rows[0]?.last_error ?? "",
		queue: num(queued[0]?.count)
	};
}
var modelCalls = /* @__PURE__ */ new Map();
async function gatedThink(sql, orgId, think, input, classification) {
	const decision = providerDecision({
		classification,
		disclosure: await readDisclosure(sql, orgId)
	});
	if (!decision.send) return {
		text: "",
		model: "",
		unavailable: true,
		provider: "local",
		outcome: "withheld",
		durationMs: 0,
		errorCategory: decision.reason
	};
	const gate = unpricedDispatch(await readCostPolicy(sql, orgId), (await pricedQuote(sql, orgId, "pollinations", "openai-fast", null, null, null)).kind);
	if (!gate.allow) return {
		text: "",
		model: "",
		unavailable: true,
		provider: "local",
		outcome: "withheld",
		durationMs: 0,
		errorCategory: gate.reason
	};
	const now = Date.now();
	const recent = (modelCalls.get(orgId) ?? []).filter((at) => now - at < 6e4);
	if (recent.length >= 40) return {
		text: "",
		model: "",
		unavailable: true,
		provider: "local",
		outcome: "withheld",
		durationMs: 0,
		errorCategory: "Rate limit"
	};
	recent.push(now);
	modelCalls.set(orgId, recent);
	const started = Date.now();
	const thought = await think(input);
	const outcome = thought.outcome ?? (thought.text.trim() ? "succeeded" : "failed");
	return {
		...thought,
		provider: outcome === "succeeded" && thought.text.trim() ? "pollinations" : "local",
		outcome,
		durationMs: thought.durationMs ?? Date.now() - started,
		errorCategory: thought.errorCategory ?? ""
	};
}
async function peerMissions(sql, orgId, missionId) {
	return (await sql`
    select id, title, status from missions
    where organization_id = ${orgId} and id <> ${missionId}
    order by updated_at desc limit 20`).flatMap((row) => {
		if (!isMissionStatus(row.status)) return [];
		return [{
			id: row.id,
			title: row.title,
			status: row.status
		}];
	});
}
async function workerCounts(sql, orgId) {
	const rows = await sql`
    select status, count(*)::int as count from execution_jobs
    where organization_id = ${orgId} and status in ('leased', 'retry', 'dead')
    group by status`;
	const workers = {
		leased: 0,
		retry: 0,
		dead: 0
	};
	for (const row of rows) if (row.status === "leased" || row.status === "retry" || row.status === "dead") workers[row.status] = num(row.count);
	return workers;
}
async function missionJobs(sql, missionId) {
	return (await sql`
    select status, attempt, last_error, updated_at from execution_jobs
    where mission_id = ${missionId} order by created_at desc limit 8`).map((row) => ({
		status: row.status,
		attempt: num(row.attempt),
		lastError: row.last_error,
		updatedAt: iso(row.updated_at)
	}));
}
async function latestQa(sql, orgId, missionId, currentHtml) {
	const row = (await sql`
    select status, artifact_sha256, report, execution_id, suite from qa_reports
    where organization_id = ${orgId} and mission_id = ${missionId}
    order by created_at desc limit 1`)[0];
	if (!row) return null;
	const current = evidenceStillCovers(row.artifact_sha256, sha256(currentHtml), row.status) || row.artifact_sha256 === sha256(currentHtml);
	let report = {};
	try {
		report = typeof row.report === "string" ? JSON.parse(row.report) : row.report ?? {};
	} catch {
		return {
			status: row.status,
			sha256: row.artifact_sha256,
			detail: "The stored report could not be read.",
			executionId: row.execution_id ?? "",
			suite: row.suite ?? "",
			current,
			tests: []
		};
	}
	const tests = Array.isArray(report?.tests) ? report.tests.flatMap((item) => {
		if (!item || typeof item !== "object") return [];
		const test = item;
		if (typeof test.name !== "string" || typeof test.passed !== "boolean") return [];
		return [{
			name: test.name,
			passed: test.passed,
			detail: typeof test.detail === "string" ? test.detail : ""
		}];
	}) : [];
	return {
		status: row.status,
		sha256: row.artifact_sha256,
		detail: typeof report?.detail === "string" ? report.detail : "",
		executionId: row.execution_id ?? "",
		suite: row.suite ?? "",
		current,
		tests
	};
}
function assertOwner(ws) {
	if (ws.role !== "owner") throw new CompanyError("Only the owner can direct the company.");
}
async function requireOwnerScope(sql, userId) {
	const ws = await ensureCompany(sql, userId);
	assertOwner(ws);
	return {
		orgId: ws.orgId,
		orgName: ws.orgName
	};
}
function readStrings(value) {
	try {
		const raw = typeof value === "string" ? JSON.parse(value) : value;
		return Array.isArray(raw) ? raw.filter((item) => typeof item === "string") : [];
	} catch {
		return [];
	}
}
function readChecks(value) {
	try {
		const raw = typeof value === "string" ? JSON.parse(value) : value;
		if (!Array.isArray(raw)) return [];
		return raw.flatMap((item) => {
			if (!item || typeof item !== "object") return [];
			const row = item;
			if (typeof row.name !== "string" || typeof row.passed !== "boolean") return [];
			return [{
				name: row.name,
				passed: row.passed,
				detail: typeof row.detail === "string" ? row.detail : ""
			}];
		});
	} catch {
		return [];
	}
}
function nid(prefix) {
	return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}
function num(value) {
	const n = typeof value === "bigint" ? Number(value) : Number(value ?? 0);
	return Number.isFinite(n) ? n : 0;
}
function iso(value) {
	if (value instanceof Date) return value.toISOString();
	return typeof value === "string" ? value : "";
}
function isUnique(error) {
	const message = error instanceof Error ? error.message : String(error);
	return message.includes("duplicate") || message.includes("23505") || message.toLowerCase().includes("unique");
}
//#endregion
export { setDependency as $, reactivateCompanyRole as A, rejectMission as B, linkMissionProject as C, payments as D, operations as E, recordPrice as F, retireCompanyOffer as G, requestExternalAction as H, recoverRun as I, runNext as J, revokeGithub as K, refreshGithub as L, recordExpenditure as M, recordObservation as N, planMission as O, recordPayment as P, setDepartmentBudget as Q, registerDevice as R, knowledge as S, missionView as T, requireOwnerScope as U, reopenMission as V, reserveFunds as W, setClassification as X, setCapacity as Y, setCostPolicy as Z, deactivateCompanyRole as _, archiveCompanyParty as a, setScheduler as at, expireLeases as b, authorizeMission as c, unlinkMissionTask as ct, commandCenter as d, setDisclosure as et, commandDevice as f, createCompanyParty as g, createCompanyOffer as h, answerMission as i, setPriority as it, readGithubForDepartment as j, proposeSpecification as k, authorizeRevalidation as l, voidPayment as lt, connectGithub as m, acceptSpecification as n, setMissionBudget as nt, assertCommandRate as o, setSpendingCeiling as ot, company_store_BXO2tnDW_exports as p, rework as q, addCompanyContact as r, setParent as rt, assignCompanyRole as s, submitMission as st, acceptMission as t, setMilestone as tt, cancelMission as u, workforce as ut, editCompanyOffer as v, linkMissionTask as w, governance as x, editCompanyParty as y, registerIntegration as z };
