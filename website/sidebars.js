module.exports = [
    [
        {
            type: 'category',
            label: 'Introduction',
            items: [
                '01_introduction/index',
                '01_introduction/installation',
                '01_introduction/quick-start',
            ],
        },
        {
            type: 'category',
            label: 'Concepts',
            items: [
                '02_concepts/01_authentication',
                '02_concepts/02_client_architecture',
                '02_concepts/03_error_handling',
                '02_concepts/04_retries',
                '02_concepts/05_pagination',
                '02_concepts/06_nested_clients',
            ],
        },
        {
            type: 'category',
            label: 'Guides',
            items: [
                '03_guides/01_passing_input_to_actors',
                '03_guides/02_retrieving_datasets',
                '03_guides/03_joining_datasets',
                '03_guides/04_using_webhooks',
                '03_guides/05_convenience_functions',
            ],
        },
        'changelog',
    ],
];
