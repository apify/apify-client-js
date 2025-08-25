const c = require('ansi-colors');

const MOCKED_ACTOR_LOGS = ['2025-05-13T07:24:12.588Z ACTOR: Pulling Docker image of build.\n',
    '2025-05-13T07:24:12.686Z ACTOR: Creating Docker container.\n',
    '2025-05-13T07:24:12.745Z ACTOR: Starting Docker container.\n', // Several logs merged into one chunk
    Buffer.from('2025-05-13T07:26:14.132Z [apify] DEBUG \xc3', 'binary'), // Chunked log split in the middle of the multibyte character
    Buffer.from([0xa1, 0x0a]),
    '2025-05-13T07:24:14.132Z [apify] INFO multiline \n log\n',
    '2025-05-13T07:25:14.132Z [apify] WARNING some warning\n',
    '2025-05-13T07:26:14.132Z [apify] DEBUG c\n',
    '2025-05-13T0', // Chunked log that got split in the marker
    '7:26:14.132Z [apify] DEBUG d \n',
    '2025-05-13T07:27:14.132Z [apify] DEB', // Chunked log that got split outside of marker
    'UG e\n',
    '2025-05-13T07:28:14.132Z [apify.redirect-logger runId:4U1oAnKau6jpzjUuA] -> 2025-05-13T07:27:14.132Z ACTOR:...\n' // Already redirected message
];


const  MOCKED_ACTOR_LOGS_PROCESSED= ['2025-05-13T07:24:12.588Z ACTOR: Pulling Docker image of build.',
    `${c.gray('2025-05-13T07:24:12.686Z')  }ACTOR: Creating Docker container.`,
    '2025-05-13T07:24:12.745Z ACTOR: Starting Docker container.',
    '2025-05-13T07:26:14.132Z [apify] DEBUG á',
    '2025-05-13T07:24:14.132Z [apify] INFO multiline \n log',
    '2025-05-13T07:25:14.132Z [apify] WARNING some warning',
    '2025-05-13T07:26:14.132Z [apify] DEBUG c',
    '2025-05-13T07:26:14.132Z [apify] DEBUG d',
    '2025-05-13T07:27:14.132Z [apify] DEBUG e',
    '2025-05-13T07:28:14.132Z [apify.redirect-logger runId:4U1oAnKau6jpzjUuA] -> 2025-05-13T07:27:14.132Z ACTOR:...'
];

module.exports =  {MOCKED_ACTOR_LOGS, MOCKED_ACTOR_LOGS_PROCESSED} ;
