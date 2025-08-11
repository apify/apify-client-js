const MOCKED_ACTOR_LOGS = ['a'.repeat(17000),'2025-05-13T07:24:12.588Z ACTOR: Pulling Docker image of build.\n',
    '2025-05-13T07:24:12.686Z ACTOR: Creating Docker container.\n',
    '2025-05-13T07:24:12.745Z ACTOR: Starting Docker container.\n',
    '2025-05-13T07:26:14.132Z [apify] DEBUG \xc3',
    '\xa1\n',
    '2025-05-13T07:24:14.132Z [apify] INFO multiline \n log\n',
    '2025-05-13T07:25:14.132Z [apify] WARNING some warning\n',
    '2025-05-13T07:26:14.132Z [apify] DEBUG c\n',
    '2025-05-13T0',
    '7:26:14.132Z [apify] DEBUG d \n',
    '2025-05-13T07:27:14.132Z [apify] DEB',
    'UG e\n',
    '2025-05-13T07:28:14.132Z [apify.redirect-logger runId:4U1oAnKau6jpzjUuA] -> 2025-05-13T07:27:14.132Z ACTOR:...\n'
];

module.exports = MOCKED_ACTOR_LOGS;
