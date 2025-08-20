// Centralized content data for all projects

// Fallback image generator
function picsum(seed, w=1200, h=800){ return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`; }

// Complete overlay content for all 15 projects
window.OVERLAY_CONTENT = {
  // ALPHA PROJECTS (Analysis - Layout Type 1)
  alpha1: {
    layoutType: 2,
    title: 'Solar & Daylight Audit',
    images: [
      "/SNTI_LAB/content/sol_1/3.png",
      "/SNTI_LAB/content/sol_1/2.png", 
      "/SNTI_LAB/content/sol_1/4.png"
    ],
    paragraphs: [
      'We perform clear, client-friendly sunlight and façade analysis using Grasshopper and Ladybug to show how daylight, shadows and heat affect your building and site.',
'This cuts analysis from days to hours, improves accuracy with data-driven simulation, and uses generative algorithms to rapidly test multiple massing and façade options.',
'Inputs: 3D model and site/location. Outputs: clear visualizations, flagged problem areas (excess shadow or overheating), and optimal massing/facade options for easy comparison.'
    ],
    list: [
      { img: "https://images.unsplash.com/photo-1556337410-473d87776943?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", text: 'Real-time data processing with sub-second latency' },
      { img: "https://images.unsplash.com/photo-1740906574432-4195b969ef24?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", text: 'AI-powered predictive analytics and trend detection' },
      { img: "https://plus.unsplash.com/premium_photo-1701158347546-4bd6c1a25154?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", text: 'Customizable dashboards with 50+ visualization types' }
    ],
    blocks: [
      { img: "https://images.unsplash.com/photo-1737348793783-414ba6bfef81?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", text: 'Technology: Rhino, Grasshopper, Ladybug, Python, parametric/generative algorithms' },
      { img: "https://images.unsplash.com/photo-1582205050683-d2c42d324475?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", text: 'Impact: 65% faster decision-making, $2M+ in trading profits', reverse: true }
    ],
    figure: { img: "https://plus.unsplash.com/premium_photo-1732835088231-6674e3167640?q=80&w=1288&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", caption: 'Sun analysis & generative massing — example results and workflow' }
  },

  alpha2: {
    layoutType: 2,
    title: 'Urban Element Design & CNC Fabrication',
    images: [
      "/SNTI_LAB/content/sol_2/1.png",
      "/SNTI_LAB/content/sol_2/2.png", 
      "/SNTI_LAB/content/sol_2/3.png"
    ],
    paragraphs: [
      'We model 3D urban elements of any form — street furniture, planters, dividers and more — turning sketches into precise, buildable parametric designs.',
      'Using lattice modelling and flexible wood-veneer coverings with subsequent plastering and lacquering, we realize complex bionic shapes; our generative workflows rapidly iterate options and optimize the final geometry',
      'Inputs: your sketches, concept notes and site (if available). Outputs: optimized 3D models, fabrication drawings for CNC'
    ],
    list: [
      { img: picsum('alpha2-journey'), text: 'Complete customer journey mapping and analysis' },
      { img: picsum('alpha2-segments'), text: 'Dynamic customer segmentation with 95% accuracy' },
      { img: picsum('alpha2-predict'), text: 'Churn prediction with 3-month forecast accuracy' }
    ],
    blocks: [
      { img: picsum('alpha2-stack'), text: 'Technology: Rhino, Grasshopper, Kangaroo, Python, CNC/CAM, lattice/veneer fabrication' },
      { img: picsum('alpha2-results'), text: 'Results: 40% increase in retention, 25% boost in conversions', reverse: true }
    ],
    figure: { img: picsum('alpha2-funnel'), caption: 'Parametric urban forms — rapid prototyping to CNC-ready fabrication' }
  },

  alpha3: {
    layoutType: 1, 
    title: 'Social Media Sentiment Engine',
    images: [
      picsum('alpha3-sentiment'),
      picsum('alpha3-social'),
      picsum('alpha3-trends')
    ],
    paragraphs: [
      'Large-scale social media sentiment analysis engine processing millions of posts daily.',
      'Natural language processing identifies brand mentions, sentiment trends, and influence patterns.',
      'Real-time alerts enable rapid response to PR crises and viral opportunities.'
    ],
    list: [
      { img: picsum('alpha3-nlp'), text: 'Multi-language NLP with 92% sentiment accuracy' },
      { img: picsum('alpha3-realtime'), text: 'Real-time monitoring across 15+ social platforms' },
      { img: picsum('alpha3-influence'), text: 'Influencer identification and impact measurement' }
    ],
    blocks: [
      { img: picsum('alpha3-tech'), text: 'Technologies: Python, spaCy, Docker, Kubernetes, InfluxDB' },
      { img: picsum('alpha3-scale'), text: 'Scale: 10M+ posts/day, 50+ languages, 99.9% uptime', reverse: true }
    ],
    figure: { img: picsum('alpha3-network'), caption: 'Social Network Analysis - Influence Mapping' }
  },

  alpha4: {
    layoutType: 1,
    title: 'Financial Risk Assessment',
    images: [
      picsum('alpha4-risk'),
      picsum('alpha4-models'),
      picsum('alpha4-portfolio')
    ],
    paragraphs: [
      'Sophisticated financial risk assessment platform for portfolio management and investment analysis.',
      'Monte Carlo simulations and stress testing provide comprehensive risk modeling capabilities.',
      'Regulatory compliance tools ensure adherence to international financial standards.'
    ],
    list: [
      { img: picsum('alpha4-monte'), text: 'Monte Carlo simulations with 10,000+ scenarios' },
      { img: picsum('alpha4-stress'), text: 'Stress testing against historical market events' },
      { img: picsum('alpha4-compliance'), text: 'Automated compliance reporting for multiple jurisdictions' }
    ],
    blocks: [
      { img: picsum('alpha4-quant'), text: 'Quantitative models: VaR, CVaR, Expected Shortfall, Beta analysis' },
      { img: picsum('alpha4-performance'), text: 'Performance: 30% better risk-adjusted returns for clients', reverse: true }
    ],
    figure: { img: picsum('alpha4-correlation'), caption: 'Risk Correlation Matrix - Portfolio Optimization' }
  },

  alpha5: {
    layoutType: 1,
    title: 'Supply Chain Intelligence',
    images: [
      picsum('alpha5-supply'),
      picsum('alpha5-logistics'),
      picsum('alpha5-optimization')
    ],
    paragraphs: [
      'End-to-end supply chain intelligence platform optimizing global logistics operations.',
      'Predictive analytics forecast demand fluctuations and identify potential disruptions.',
      'IoT integration provides real-time visibility into inventory levels and shipment status.'
    ],
    list: [
      { img: picsum('alpha5-forecast'), text: 'Demand forecasting with 85% accuracy over 6 months' },
      { img: picsum('alpha5-iot'), text: 'IoT sensor integration for real-time tracking' },
      { img: picsum('alpha5-optimization'), text: 'Route optimization reducing costs by 20%' }
    ],
    blocks: [
      { img: picsum('alpha5-tech'), text: 'Platform: Java, Spring Boot, Apache Spark, Azure IoT Hub' },
      { img: picsum('alpha5-savings'), text: 'Impact: $5M annual savings, 15% faster delivery times', reverse: true }
    ],
    figure: { img: picsum('alpha5-network'), caption: 'Global Supply Network - Optimization Routes' }
  },

  // BETA PROJECTS (Optimization - Layout Type 2)
  beta1: {
    layoutType: 2,
    title: 'Performance Optimization Suite',
    images: [
      picsum('beta1-performance'),
      picsum('beta1-monitoring'),
      picsum('beta1-optimization')
    ],
    paragraphs: [
      'Comprehensive web performance optimization suite for enterprise applications.',
      'Automated code analysis identifies bottlenecks and suggests performance improvements.',
      'Real-time monitoring provides alerts and detailed performance metrics across global CDN.'
    ],
    list: [
      { img: picsum('beta1-analysis'), text: 'Automated code analysis and optimization suggestions' },
      { img: picsum('beta1-cdn'), text: 'Global CDN optimization with edge computing' },
      { img: picsum('beta1-alerts'), text: 'Smart alerting system with predictive notifications' }
    ],
    blocks: [
      { img: picsum('beta1-stack'), text: 'Technology stack: Node.js, Webpack, Lighthouse CI, New Relic integration' }
    ],
    figure: { img: picsum('beta1-metrics'), caption: 'Performance Metrics Dashboard - Before/After Optimization Results' }
  },

  beta2: {
    layoutType: 2,
    title: 'Database Query Optimizer',
    images: [
      picsum('beta2-database'),
      picsum('beta2-queries'),
      picsum('beta2-performance')
    ],
    paragraphs: [
      'Advanced database query optimization engine reducing response times by up to 80%.',
      'Intelligent indexing strategies and query rewriting algorithms improve database efficiency.',
      'Support for PostgreSQL, MySQL, MongoDB with automated optimization recommendations.'
    ],
    list: [
      { img: picsum('beta2-indexing'), text: 'Intelligent indexing with automatic maintenance' },
      { img: picsum('beta2-rewrite'), text: 'Query rewriting and execution plan optimization' },
      { img: picsum('beta2-monitoring'), text: 'Continuous monitoring with performance insights' }
    ],
    blocks: [
      { img: picsum('beta2-algorithms'), text: 'Advanced algorithms: Cost-based optimization, Join ordering, Index selection' }
    ],
    figure: { img: picsum('beta2-comparison'), caption: 'Query Performance Comparison - Optimization Impact Analysis' }
  },

  beta3: {
    layoutType: 2,
    title: 'Cloud Infrastructure Optimizer',
    images: [
      picsum('beta3-cloud'),
      picsum('beta3-infrastructure'),
      picsum('beta3-costs')
    ],
    paragraphs: [
      'Multi-cloud infrastructure optimization platform reducing operational costs by 40%.',
      'Automated resource scaling based on predictive load analysis and usage patterns.',
      'Cost optimization recommendations across AWS, Azure, and Google Cloud Platform.'
    ],
    list: [
      { img: picsum('beta3-scaling'), text: 'Predictive auto-scaling with machine learning' },
      { img: picsum('beta3-cost'), text: 'Cost optimization across multiple cloud providers' },
      { img: picsum('beta3-security'), text: 'Security compliance monitoring and automation' }
    ],
    blocks: [
      { img: picsum('beta3-orchestration'), text: 'Orchestration: Kubernetes, Terraform, Ansible with custom optimization policies' }
    ],
    figure: { img: picsum('beta3-savings'), caption: 'Cloud Cost Savings Report - Multi-Cloud Optimization Results' }
  },

  beta4: {
    layoutType: 2,
    title: 'API Performance Gateway',
    images: [
      picsum('beta4-api'),
      picsum('beta4-gateway'),
      picsum('beta4-analytics')
    ],
    paragraphs: [
      'High-performance API gateway with intelligent routing and optimization capabilities.',
      'Request caching, rate limiting, and load balancing ensure optimal API performance.',
      'Comprehensive analytics provide insights into API usage patterns and optimization opportunities.'
    ],
    list: [
      { img: picsum('beta4-routing'), text: 'Intelligent routing with geographic optimization' },
      { img: picsum('beta4-caching'), text: 'Multi-layer caching with intelligent invalidation' },
      { img: picsum('beta4-throttling'), text: 'Advanced rate limiting and traffic shaping' }
    ],
    blocks: [
      { img: picsum('beta4-tech'), text: 'Built with: Go, Redis, Nginx, Consul for high-throughput processing' }
    ],
    figure: { img: picsum('beta4-throughput'), caption: 'API Throughput Analysis - Performance Under Load' }
  },

  beta5: {
    layoutType: 2,
    title: 'Mobile App Optimization',
    images: [
      picsum('beta5-mobile'),
      picsum('beta5-app'),
      picsum('beta5-performance')
    ],
    paragraphs: [
      'Mobile application performance optimization platform for iOS and Android apps.',
      'Battery usage optimization and memory management reduce app crashes by 75%.',
      'A/B testing framework enables data-driven optimization of user experience flows.'
    ],
    list: [
      { img: picsum('beta5-battery'), text: 'Battery optimization with intelligent background processing' },
      { img: picsum('beta5-memory'), text: 'Memory management and crash prevention systems' },
      { img: picsum('beta5-testing'), text: 'A/B testing framework with statistical significance' }
    ],
    blocks: [
      { img: picsum('beta5-frameworks'), text: 'Supports: React Native, Flutter, Xamarin with native optimizations' }
    ],
    figure: { img: picsum('beta5-metrics'), caption: 'Mobile Performance Metrics - User Experience Optimization' }
  },

  // GAMMA PROJECTS (Formation - Layout Type 3)
  gamma1: {
    layoutType: 3,
    title: 'Strategic Planning Framework',
    images: [
      picsum('gamma1-strategy'),
      picsum('gamma1-planning'),
      picsum('gamma1-execution')
    ],
    paragraphs: [
      'Comprehensive strategic planning framework for enterprise transformation initiatives.',
      'Collaborative tools enable cross-functional teams to align on objectives and track progress.'
    ],
    list: [
      { img: picsum('gamma1-goals'), text: 'OKR management with automated progress tracking' },
      { img: picsum('gamma1-collab'), text: 'Team collaboration tools with real-time updates' },
      { img: picsum('gamma1-reporting'), text: 'Executive reporting with predictive analytics' }
    ],
    blocks: [
      { img: picsum('gamma1-methodology'), text: 'Proven methodology based on McKinsey 7S and Balanced Scorecard frameworks' },
      { img: picsum('gamma1-success'), text: '95% project success rate with 30% faster time-to-market', reverse: true }
    ],
    figure: { img: picsum('gamma1-roadmap'), caption: 'Strategic Roadmap Visualization - Milestone Tracking' }
  },

  gamma2: {
    layoutType: 3,
    title: 'Digital Transformation Hub',
    images: [
      picsum('gamma2-digital'),
      picsum('gamma2-transformation'),
      picsum('gamma2-innovation')
    ],
    paragraphs: [
      'Digital transformation accelerator helping organizations modernize legacy systems.',
      'Change management tools ensure smooth transitions with minimal business disruption.'
    ],
    list: [
      { img: picsum('gamma2-assessment'), text: 'Digital maturity assessment with actionable roadmaps' },
      { img: picsum('gamma2-change'), text: 'Change management with employee engagement tracking' },
      { img: picsum('gamma2-innovation'), text: 'Innovation labs for rapid prototyping and testing' }
    ],
    blocks: [
      { img: picsum('gamma2-approach'), text: 'Holistic approach: Technology, Process, People, and Culture transformation' },
      { img: picsum('gamma2-roi'), text: '300% average ROI within 18 months of implementation', reverse: true }
    ],
    figure: { img: picsum('gamma2-maturity'), caption: 'Digital Maturity Model - Transformation Journey' }
  },

  gamma3: {
    layoutType: 3,
    title: 'Agile Development Accelerator',
    images: [
      picsum('gamma3-agile'),
      picsum('gamma3-development'),
      picsum('gamma3-delivery')
    ],
    paragraphs: [
      'Agile development framework accelerating software delivery cycles by 50%.',
      'Integrated DevOps pipelines ensure continuous integration and deployment.'
    ],
    list: [
      { img: picsum('gamma3-scrum'), text: 'Scrum framework with automated sprint planning' },
      { img: picsum('gamma3-devops'), text: 'DevOps pipeline with automated testing and deployment' },
      { img: picsum('gamma3-metrics'), text: 'Velocity tracking and burndown analytics' }
    ],
    blocks: [
      { img: picsum('gamma3-practices'), text: 'Best practices: TDD, Pair Programming, Code Reviews, Continuous Refactoring' },
      { img: picsum('gamma3-velocity'), text: '50% faster delivery with 60% fewer defects in production', reverse: true }
    ],
    figure: { img: picsum('gamma3-pipeline'), caption: 'CI/CD Pipeline Visualization - Automated Delivery Process' }
  },

  gamma4: {
    layoutType: 3,
    title: 'Innovation Management Platform',
    images: [
      picsum('gamma4-innovation'),
      picsum('gamma4-ideation'),
      picsum('gamma4-portfolio')
    ],
    paragraphs: [
      'Innovation management platform fostering creativity and idea development.',
      'Portfolio management tools help prioritize and track innovation investments.'
    ],
    list: [
      { img: picsum('gamma4-ideation'), text: 'Crowdsourced ideation with AI-powered evaluation' },
      { img: picsum('gamma4-portfolio'), text: 'Innovation portfolio management with ROI tracking' },
      { img: picsum('gamma4-collaboration'), text: 'Cross-functional collaboration tools and workshops' }
    ],
    blocks: [
      { img: picsum('gamma4-process'), text: 'Stage-gate process: Ideation → Evaluation → Prototyping → Implementation' },
      { img: picsum('gamma4-impact'), text: '200+ new product ideas generated, 15 brought to market', reverse: true }
    ],
    figure: { img: picsum('gamma4-funnel'), caption: 'Innovation Funnel - From Idea to Implementation' }
  },

  gamma5: {
    layoutType: 3,
    title: 'Organizational Design Studio',
    images: [
      picsum('gamma5-organization'),
      picsum('gamma5-structure'),
      picsum('gamma5-culture')
    ],
    paragraphs: [
      'Organizational design studio creating adaptive and resilient organizational structures.',
      'Culture transformation initiatives align values with business objectives.'
    ],
    list: [
      { img: picsum('gamma5-design'), text: 'Organizational design with network analysis' },
      { img: picsum('gamma5-culture'), text: 'Culture assessment and transformation programs' },
      { img: picsum('gamma5-talent'), text: 'Talent development and succession planning' }
    ],
    blocks: [
      { img: picsum('gamma5-principles'), text: 'Design principles: Agility, Transparency, Empowerment, Customer-centricity' },
      { img: picsum('gamma5-engagement'), text: '85% employee engagement score, 40% reduction in turnover', reverse: true }
    ],
    figure: { img: picsum('gamma5-network'), caption: 'Organizational Network Analysis - Communication Patterns' }
  }
};

// Content provider for overlay data
window.getOverlayData = function(projectId, category, title, images) {
  // Base content with reduced text for better fitting
  const baseContent = {
    title: title,
    images: images || [],
    paragraphs: [
      `${title} represents innovative approach to ${category} methodology.`,
      `Key insights and strategic solutions developed through comprehensive analysis.`
    ],
    list: [
      { img: images[0], text: 'Research phase with data collection and analysis.' },
      { img: images[1], text: 'Implementation of optimized solutions.' },
      { img: images[2], text: 'Results validation and performance metrics.' }
    ],
    blocks: [
      { 
        img: images[1], 
        text: 'Strategic framework development with focus on efficiency and scalability.',
        reverse: false 
      },
      { 
        img: images[2], 
        text: 'Quality assurance protocols ensuring optimal outcomes.',
        reverse: true 
      }
    ],
    figure: {
      img: images[2],
      caption: `Visual representation of ${title} implementation results.`
    }
  };

  // Category-specific customizations with shorter text
  if (category === 'alpha') {
    baseContent.paragraphs = [
      `${title} focuses on data analysis and pattern recognition.`,
      `Advanced analytics provide actionable insights.`
    ];
    baseContent.list = [
      { img: images[0], text: 'Data collection and preprocessing.' },
      { img: images[1], text: 'Statistical analysis and modeling.' },
      { img: images[2], text: 'Pattern recognition and insights.' }
    ];
  } else if (category === 'beta') {
    baseContent.paragraphs = [
      `${title} optimizes processes through systematic improvement.`,
      `Performance enhancement with measurable results.`
    ];
    baseContent.blocks = [
      { 
        img: images[1], 
        text: 'Process optimization with efficiency metrics.',
        reverse: false 
      }
    ];
  } else if (category === 'gamma') {
    baseContent.paragraphs = [
      `${title} establishes foundational frameworks.`,
      `Strategic formation with long-term vision.`
    ];
  }

  return baseContent;
};
