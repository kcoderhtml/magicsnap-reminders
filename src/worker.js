import { LogSnag } from '@logsnag/node';

async function sendEmails(env) {
	try {
		const logsnag = new LogSnag({
			token: env.LOGSNAG_TOKEN,
			project: 'magicsnap',
		});

		const db = await (
			await fetch('https://www.magicsnap.org/api/remind', {
				method: 'POST',
				headers: {
					Authorization: env.TOKEN,
				},
			})
		).json();

		if (!db || !db.eventsHappeningToday || !db.users || !db.organizations) {
			throw new Error(`Missing data in API response: ${!db} ${!db.eventsHappeningToday} ${!db.users} ${!db.organizations}`);
		}

		if (db.ok) {
			const eventsHappeningToday = db.eventsHappeningToday;
			const users = db.users;
			const organizations = db.organizations;

			for (const org of organizations) {
				const teamMembers = users.filter((u) => u.team === org.team);
				console.log(`Organization: ${org.name} has ${teamMembers.length} team members`);

				for (const member of teamMembers) {
					console.log(`Sending Email to ${member.role}: ${member.name} (${member.email})`);

					// get all events that the user is going to
					const eventsGoing = eventsHappeningToday.filter((e) => e.statusGoing.includes(member.userId));

					// get all events that the user is maybe going to
					const eventsMaybe = eventsHappeningToday.filter((e) => e.statusMaybe.includes(member.userId));

					// get all events that the user is not going to
					const eventsNotGoing = eventsHappeningToday.filter((e) => e.statusNotGoing.includes(member.userId));

					// send email to user
					const message = `Hey ${member.name},\nJust a friendly reminder about your schedule for tomorrow, ${new Date().toLocaleDateString(
						'en-US',
						{ weekday: 'long', month: 'long', day: 'numeric' }
					)}:`;
					let emailMessage = message;

					if (eventsGoing.length > 0) {
						const going = eventsGoing
							.map(
								(e) =>
									`* **${e.name}** at ${e.location} on ${new Date(e.date).toLocaleString('en-US', {
										weekday: 'long',
										month: 'long',
										day: 'numeric',
										hour: 'numeric',
										minute: 'numeric',
									})} \n  - ${e.comments} \n  - [update your availability](http://localhost:8888/update/${e.team}/${e.id}/${
										member.userId
									}?hash=${member.hash})`
							)
							.join('\n');
						emailMessage += "\n\n**Events you're attending:**\n" + going;
					}

					if (eventsMaybe.length > 0) {
						const maybe = eventsMaybe
							.map(
								(e) =>
									`* **${e.name}** at ${e.location} on ${new Date(e.date).toLocaleString('en-US', {
										weekday: 'long',
										month: 'long',
										day: 'numeric',
										hour: 'numeric',
										minute: 'numeric',
									})} \n  - ${e.comments} \n  - [update your availability](http://localhost:8888/update/${e.team}/${e.id}/${
										member.userId
									}?hash=${member.hash})`
							)
							.join('\n');
						emailMessage += '\n\n**Events you might be attending:**\n' + maybe;
					}

					if (eventsNotGoing.length > 0) {
						const notGoing = eventsNotGoing
							.map(
								(e) =>
									`* **${e.name}** at ${e.location} on ${new Date(e.date).toLocaleString('en-US', {
										weekday: 'long',
										month: 'long',
										day: 'numeric',
										hour: 'numeric',
										minute: 'numeric',
									})} \n  - ${e.comments} \n  - [update your availability](http://localhost:8888/update/${e.team}/${e.id}/${
										member.userId
									}?hash=${member.hash})`
							)
							.join('\n');
						emailMessage += '\n\n**Events you declined:**\n' + notGoing;
					}

					if (eventsGoing.length === 0 && eventsMaybe.length === 0 && eventsNotGoing.length === 0) {
						continue;
					}

					emailMessage += "\n\nDon't forget to stay organized and have a productive day!";

					emailMessage += '\n\nAll the Best,  \nYour friendly neighborhood event reminder bot';

					emailMessage += '\n\n-----\n\n';
					emailMessage += `*This email was sent by MagicSnap because you are a member of ${org.name}. If you have any questions or need assistance, please contact us at spellcheck@magicsnap.org.*`;

					// console.log(emailMessage)
					const response = await fetch('https://email.magicsnap.org/api/email', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Authorization: env.EMAIL_API_KEY,
						},
						body: JSON.stringify({
							to: member.email,
							from: 'eventwizard@magicsnap.org',
							subject:
								'Event Reminder for ' +
								new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
							markdown: emailMessage,
						}),
					});

					if (!response.ok) {
						console.error(await response.text);
					}
				}
			}

			await logsnag.track({
				channel: 'api',
				event: 'reminder-sent',
				description: `Sent reminder to ${users.length} users in ${organizations.length} different organizations about ${eventsHappeningToday.length} events happening today`,
				icon: '📬',
			});

			return new Response('success', { status: 200 });
		}
	} catch (error) {
		console.error(error);
		await logsnag.track({
			channel: 'api',
			event: 'reminder-error',
			description: error,
			icon: '🚨',
		});

		return new Response('Internal Server Error: ' + error, { status: 500 });
	}
}

export default {
	async fetch(request, env, ctx) {
		return await sendEmails(env);
	},

	async scheduled(event, env, ctx) {
		await sendEmails(env);
	},
};
