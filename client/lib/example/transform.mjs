import { convertCipherToString, convertStringToCipher } from "../helper.mjs";

const points = [
    [
      [
        1884506042712102483688267151739377807461925051294532751760n,
        3147920523848560289683628343919557655337595297356939844731n 
      ],
      [
        765087202824259130632896412357581704347037421157240961557n, 
        706135021989326638708607846925403569326038865004386019661n  
      ]
    ],
    [
      [
        3064155328951678191704728909264136373179330346692452435665n,
        5073917581906889625220423294168515607733206690774918456598n 
      ],
      [
        4700406449899902540181924557873596568767903979642811104565n,
        4779525567966733546101788648466305945606244909676698056798n
      ]
    ],
    [
      [
        993572794375227049759923780527084328473040655688524115104n,
        4207404793133189962428046633729060251751501048530018155067n
      ],
      [
        5166413258679281607215955874367420554104225840075373000882n,
        2929862118422365514117726688464059661866663606131104152398n
      ]
    ],
    [
      [
        3622316367306785702396498422580247765565626382619906682229n,
        621587292813910677909327209481131925923757590026236599783n
      ],
      [
        3903334274053764271225709464612469231672005269843417164597n,
        4898101994291329936725346739951096186586786018436031851543n
      ]
    ],
    [
      [
        4542384332137581949105566358723657738342281644730900282855n,
        4190028836709591305310372767915360016858352099239119737694n
      ],
      [
        3597089920733593512535675102151006513634509821870589871992n,
        3778070358002330363724504306101760045974446904279010298000n
      ]
    ],
    [
      [
        5420606519860165992510956974174733522366752763855301361981n,
        3807917588498687407471705362574589758532063320323129801098n
      ],
      [
        4122969099600152673562387997721870497598336710108980619437n,
        5735618161270932768092785967099872980172262139497815031663n
      ]
    ],
    [
      [
        6195868160378798113946416031093904196439943721603290479860n,
        4603533323728695289863666743898356028503045947843113449615n
      ],
      [
        1315936411000735413587411948683527522115743903371217059360n,
        2586313716544742222941734764826579860508029082809597864875n
      ]
    ],
    [
      [
        1259180208513656410121415059167949772918939929941710070018n,
        4836939911750689293213172523416300963222574088758964831234n
      ],
      [
        574843489155003735974729024263242373635889052322452518067n,
        2219805544905444092875143495272725535999160163215908747940n
      ]
    ],
    [
      [
        1529432954966046482731282670291252250759072121433812440030n,
        2248101060378092497327558893505451834989539063200050042030n
      ],
      [
        4512485700956617073443499482834065758105873205848479363986n,
        3357978689558183702470037195054042934292150820299454477905n
      ]
    ],
    [
      [
        4689732799129349118719008245651435523136244783446959776715n,
        3535540760022398937739276943372350906995034371147239230381n
      ],
      [
        5288483497921228881868069714195019373405372894371094142664n,
        4001923750978581586860405087790120403463792367830012768721n
      ]
    ],
    [
      [
        2604909875031527937304237567258130714737408190327532512182n,
        3932172616047207336695374169838879456853506777297096493741n
      ],
      [
        4853071019345997136232023587338894476407326084563586508215n,
        3110114809293777862299503457514546388977934192652929985320n
      ]
    ]
  ]

const stringPoints = convertCipherToString(points);
console.log(stringPoints);

const cipher = convertStringToCipher(stringPoints);
console.log(cipher);