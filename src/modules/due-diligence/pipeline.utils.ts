import { DDStatus } from './dto/due-diligence.dto';

export function mapDueDiligenceToPipelineProject(item: any) {
  const metadata = item?.targetMetadata && typeof item.targetMetadata === 'object' ? item.targetMetadata : {};

  const progress = typeof metadata.progress === 'number'
    ? metadata.progress
    : typeof item?.completionPercent === 'number'
      ? item.completionPercent
      : null;

  const value = typeof metadata.value === 'number'
    ? metadata.value
    : typeof metadata.dealValue === 'number'
      ? metadata.dealValue
      : null;

  const capacity = typeof metadata.capacity === 'number' ? metadata.capacity : null;
  const irr = typeof metadata.irr === 'number' ? metadata.irr : null;
  const sponsor = typeof metadata.sponsor === 'string' ? metadata.sponsor : '';
  const country = typeof metadata.country === 'string' ? metadata.country : '';
  const city = typeof metadata.city === 'string' ? metadata.city : '';
  const tags = Array.isArray(metadata.tags)
    ? metadata.tags.filter((tag: unknown): tag is string => typeof tag === 'string')
    : [];

  const ownerName = item?.creator
    ? `${item.creator.firstName || ''}${item.creator.lastName ? ` ${item.creator.lastName}` : ''}`.trim() || item.creator.email || 'DD'
    : 'DD';
  const ownerInitials = ownerName === 'DD'
    ? 'DD'
    : [item?.creator?.firstName, item?.creator?.lastName]
        .filter(Boolean)
        .map((value: string) => value?.trim()?.[0]?.toUpperCase())
        .filter(Boolean)
        .join('');

  return {
    id: `dd-${item.id}`,
    dueDiligenceId: item.id,
    name: item?.title || 'Untitled diligence',
    type: item?.type || 'investment',
    stage: 'Due Diligence',
    country,
    city,
    capacity,
    value,
    irr,
    sponsor,
    progress,
    tags,
    description: item?.description || '',
    updated: item?.updatedAt ? new Date(item.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'just now',
    updatedAt: item?.updatedAt ? new Date(item.updatedAt).toISOString() : null,
    source: 'due-diligence',
    sourceType: 'due-diligence',
    status: item?.status || DDStatus.DRAFT,
    owner: ownerInitials || ownerName.slice(0, 2).toUpperCase(),
  };
}
